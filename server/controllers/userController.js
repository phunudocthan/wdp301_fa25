const bcrypt = require('bcryptjs');
const User = require('../models/User');

const extractAddressFields = (address = {}) => ({
  street: address.street || '',
  city: address.city || '',
  state: address.state || '',
  postalCode: address.postalCode || '',
  country: address.country || 'Vietnam',
});

const normalizeAddressResponse = (address) => {
  if (!address) return null;
  const obj = address.toObject ? address.toObject() : { ...address };
  return {
    _id: obj._id?.toString?.() || obj._id,
    label: obj.label || '',
    recipientName: obj.recipientName || '',
    phone: obj.phone || '',
    street: obj.street || '',
    city: obj.city || '',
    state: obj.state || '',
    postalCode: obj.postalCode || '',
    country: obj.country || 'Vietnam',
    isDefault: Boolean(obj.isDefault),
    archived: Boolean(obj.archived),
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  };
};

const syncPrimaryAddress = (user) => {
  if (!user) return;
  const addresses = user.addresses || [];
  const activeAddresses = addresses.filter((addr) => !addr.archived);
  let primary = activeAddresses.find((addr) => addr.isDefault);

  if (!primary && activeAddresses.length > 0) {
    primary = activeAddresses[0];
    primary.isDefault = true;
  }

  if (primary) {
    user.address = extractAddressFields(primary);
  } else {
    user.address = undefined;
  }
};

const hasLegacyAddress = (addr = {}) => {
  return Boolean(
    (addr.street && addr.street.trim()) ||
      (addr.city && addr.city.trim()) ||
      (addr.state && addr.state.trim()) ||
      (addr.postalCode && addr.postalCode.trim())
  );
};

const ensureAddressCollection = async (user) => {
  if (!user) return;
  if (!Array.isArray(user.addresses)) {
    user.addresses = [];
  }
  if (user.addresses.length === 0 && hasLegacyAddress(user.address)) {
    user.addresses.push({
      label: 'Default address',
      recipientName: user.name,
      phone: user.phone,
      street: user.address.street || '',
      city: user.address.city || '',
      state: user.address.state || '',
      postalCode: user.address.postalCode || '',
      country: user.address.country || 'Vietnam',
      isDefault: true,
      archived: false,
    });
    syncPrimaryAddress(user);
    await user.save();
  }
};

const mapAddressesForResponse = (addresses, { includeArchived = false } = {}) => {
  if (!Array.isArray(addresses)) return [];
  return addresses
    .filter((addr) => includeArchived || !addr.archived)
    .map(normalizeAddressResponse)
    .sort((a, b) => {
      if (a.isDefault && !b.isDefault) return -1;
      if (!a.isDefault && b.isDefault) return 1;
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ msg: 'User not found' });

    await ensureAddressCollection(user);

    const plain = user.toObject();
    plain.addresses = mapAddressesForResponse(user.addresses, { includeArchived: true });
    plain.address = extractAddressFields(user.address);

    res.json(plain);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, address, avatar, status, role } = req.body;

    const updateFields = {};
    if (name) updateFields.name = name;
    if (phone) updateFields.phone = phone;
    if (avatar) updateFields.avatar = avatar;
    if (address) updateFields.address = extractAddressFields(address);
    if (status) updateFields.status = status;
    if (role) updateFields.role = role;

    const user = await User.findByIdAndUpdate(req.user.id, updateFields, {
      new: true,
    }).select('-password');

    if (!user) return res.status(404).json({ msg: 'User not found' });

    await ensureAddressCollection(user);

    if (address) {
      syncPrimaryAddress(user);
      await user.save({ validateBeforeSave: false });
    }

    const plain = user.toObject();
    plain.address = extractAddressFields(user.address);
    plain.addresses = mapAddressesForResponse(user.addresses, { includeArchived: true });

    res.json(plain);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ msg: 'No file uploaded' });

    const avatarUrl = `${req.protocol}://${req.get('host')}/uploads/avatars/${req.file.filename}`;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatar: avatarUrl },
      { new: true }
    ).select('-password');

    if (!user) return res.status(404).json({ msg: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id).select('+password');

    if (!user) return res.status(404).json({ msg: 'User not found' });

    const isMatch = await bcrypt.compare(oldPassword, user.password || '');
    if (!isMatch) {
      return res.status(400).json({ msg: 'Old password is incorrect' });
    }

    const isSame = await bcrypt.compare(newPassword, user.password || '');
    if (isSame) {
      return res
        .status(400)
        .json({ msg: 'New password must be different from old password' });
    }

    const strongPasswordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!strongPasswordRegex.test(newPassword)) {
      return res.status(400).json({
        msg: 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character',
      });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save({ validateBeforeSave: false });

    res.json({ msg: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.listAddresses = async (req, res) => {
  try {
    const includeArchived = req.query.includeArchived === 'true';
    const user = await User.findById(req.user.id).select('addresses address name phone');
    if (!user) return res.status(404).json({ msg: 'User not found' });

    await ensureAddressCollection(user);

    const addresses = mapAddressesForResponse(user.addresses, { includeArchived });
    const defaultAddress = extractAddressFields(user.address);

    res.json({ addresses, defaultAddress });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createAddress = async (req, res) => {
  try {
    const {
      label,
      recipientName,
      phone,
      street,
      city,
      state,
      postalCode,
      country,
      isDefault,
    } = req.body || {};

    if (!street || typeof street !== 'string' || !street.trim()) {
      return res.status(400).json({ msg: 'Street is required' });
    }

    // Normalize and validate phone if present
    const phoneValue = phone && typeof phone === 'string' ? phone.trim() : (user && user.phone) || '';
    const phoneRegex = /^0\d{9}$/;
    if (phone && phone.trim() && !phoneRegex.test(phone.trim())) {
      return res.status(400).json({ msg: 'Phone must be 10 digits and start with 0' });
    }

    const user = await User.findById(req.user.id).select('addresses address name phone');
    if (!user) return res.status(404).json({ msg: 'User not found' });

    await ensureAddressCollection(user);

    const addressPayload = {
      label: label && label.trim() ? label.trim() : undefined,
      recipientName: recipientName && recipientName.trim() ? recipientName.trim() : user.name,
      phone: phone && phone.trim() ? phone.trim() : phoneValue,
      street: street.trim(),
      city: city?.trim() || '',
      state: state?.trim() || '',
      postalCode: postalCode?.trim() || '',
      country: country?.trim() || 'Vietnam',
      isDefault: Boolean(isDefault),
    };

    if ((user.addresses || []).length === 0) {
      addressPayload.isDefault = true;
    }

    if (!Array.isArray(user.addresses)) {
      user.addresses = [];
    }

    if (addressPayload.isDefault) {
      user.addresses.forEach((addr) => {
        addr.isDefault = false;
      });
    }

    user.addresses.push(addressPayload);
    syncPrimaryAddress(user);
    await user.save();

    const createdAddress = normalizeAddressResponse(user.addresses[user.addresses.length - 1]);

    res.status(201).json({ address: createdAddress, addresses: mapAddressesForResponse(user.addresses) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const {
      label,
      recipientName,
      phone,
      street,
      city,
      state,
      postalCode,
      country,
      setAsDefault,
    } = req.body || {};

    const user = await User.findById(req.user.id).select('addresses address');
    if (!user) return res.status(404).json({ msg: 'User not found' });

    await ensureAddressCollection(user);

    const address = user.addresses.id(addressId);
    if (!address || address.archived) {
      return res.status(404).json({ msg: 'Address not found' });
    }

    if (street && street.trim().length === 0) {
      return res.status(400).json({ msg: 'Street cannot be empty' });
    }
    // validate phone if provided
    const phoneRegex = /^0\d{9}$/;
    if (typeof phone !== 'undefined' && phone !== null) {
      if (String(phone).trim() && !phoneRegex.test(String(phone).trim())) {
        return res.status(400).json({ msg: 'Phone must be 10 digits and start with 0' });
      }
    }

    // assign trimmed/normalized values
    if (typeof label !== 'undefined') address.label = label && String(label).trim() ? String(label).trim() : undefined;
    if (typeof recipientName !== 'undefined') address.recipientName = recipientName && String(recipientName).trim() ? String(recipientName).trim() : undefined;
    if (typeof phone !== 'undefined') address.phone = phone && String(phone).trim() ? String(phone).trim() : undefined;
    if (typeof street !== 'undefined') address.street = street && String(street).trim() ? String(street).trim() : address.street;
    if (typeof city !== 'undefined') address.city = city && String(city).trim() ? String(city).trim() : '';
    if (typeof state !== 'undefined') address.state = state && String(state).trim() ? String(state).trim() : '';
    if (typeof postalCode !== 'undefined') address.postalCode = postalCode && String(postalCode).trim() ? String(postalCode).trim() : '';
    if (typeof country !== 'undefined') address.country = country && String(country).trim() ? String(country).trim() : address.country;

    if (setAsDefault) {
      user.addresses.forEach((addr) => {
        addr.isDefault = addr._id.equals(address._id);
      });
    }

    syncPrimaryAddress(user);
    await user.save();

    res.json({
      address: normalizeAddressResponse(address),
      addresses: mapAddressesForResponse(user.addresses),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.setDefaultAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const user = await User.findById(req.user.id).select('addresses address');
    if (!user) return res.status(404).json({ msg: 'User not found' });

    await ensureAddressCollection(user);

    const address = user.addresses.id(addressId);
    if (!address || address.archived) {
      return res.status(404).json({ msg: 'Address not found' });
    }

    user.addresses.forEach((addr) => {
      addr.isDefault = addr._id.equals(address._id);
    });

    syncPrimaryAddress(user);
    await user.save();

    res.json({
      address: normalizeAddressResponse(address),
      addresses: mapAddressesForResponse(user.addresses),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.archiveAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const user = await User.findById(req.user.id).select('addresses address');
    if (!user) return res.status(404).json({ msg: 'User not found' });

    await ensureAddressCollection(user);

    const address = user.addresses.id(addressId);
    if (!address) {
      return res.status(404).json({ msg: 'Address not found' });
    }

    address.archived = true;
    address.isDefault = false;

    syncPrimaryAddress(user);
    await user.save();

    res.json({ addresses: mapAddressesForResponse(user.addresses) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

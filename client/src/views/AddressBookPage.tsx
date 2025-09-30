import React, { useEffect, useMemo, useState } from "react";
import {
  MapPin,
  Plus,
  Star,
  Edit,
  Trash2,
  Save,
  X,
} from "lucide-react";
import {
  getAddresses,
  createAddress,
  updateAddress,
  setDefaultAddress,
  archiveAddress,
  AddressPayload,
} from "../api/user";
import type { UserAddress } from "../types/user";

const emptyAddressForm: AddressPayload = {
  label: "",
  recipientName: "",
  phone: "",
  street: "",
  city: "",
  state: "",
  postalCode: "",
  country: "Vietnam",
  isDefault: false,
};

const AddressBookPage: React.FC = () => {
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [defaultAddress, setDefaultAddressState] = useState<UserAddress | null>(null);
  const [formData, setFormData] = useState<AddressPayload>({ ...emptyAddressForm });
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");

  const hasAddresses = useMemo(() => addresses.length > 0, [addresses]);

  const applyAddressUpdates = (list?: UserAddress[]) => {
    if (Array.isArray(list)) {
      setAddresses(list);
      const nextDefault = list.find((addr) => addr.isDefault) || null;
      setDefaultAddressState(nextDefault);
    }
  };

  const resetForm = () => {
    setFormData({ ...emptyAddressForm });
    setMode("create");
    setEditingId(null);
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const { addresses: list, defaultAddress } = await getAddresses(false);
        applyAddressUpdates(list);
        setDefaultAddressState(defaultAddress);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load addresses");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleEdit = (address: UserAddress) => {
    setMode("edit");
    setEditingId(address._id || null);
    setFormData({
      label: address.label || "",
      recipientName: address.recipientName || "",
      phone: address.phone || "",
      street: address.street || "",
      city: address.city || "",
      state: address.state || "",
      postalCode: address.postalCode || "",
      country: address.country || "Vietnam",
      isDefault: Boolean(address.isDefault),
    });
    setMessage("");
    setError("");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting) return;

    if (!formData.street || !formData.street.trim()) {
      setError("Street address is required");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      let response;

      if (mode === "edit" && editingId) {
        response = await updateAddress(editingId, {
          ...formData,
          setAsDefault: formData.isDefault,
        });
      } else {
        response = await createAddress({ ...formData });
      }

      if (response) {
        applyAddressUpdates(response.addresses);
        if ('address' in response && response.address?.isDefault) {
          setDefaultAddressState(response.address);
        }
        setMessage(mode === "edit" ? "Address updated" : "Address added successfully");
        resetForm();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save address");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetDefault = async (addressId: string) => {
    try {
      setSubmitting(true);
      const response = await setDefaultAddress(addressId);
      applyAddressUpdates(response.addresses);
      if (response.address) {
        setDefaultAddressState(response.address);
      }
      setMessage("Default address updated");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to set default address");
    } finally {
      setSubmitting(false);
    }
  };

  const handleArchive = async (addressId: string) => {
    if (!window.confirm("Remove this address from your list?")) {
      return;
    }
    try {
      setSubmitting(true);
      const response = await archiveAddress(addressId);
      applyAddressUpdates(response.addresses || []);
      setMessage("Address removed");
      if (editingId === addressId) {
        resetForm();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to remove address");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-amber-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
              <MapPin className="text-indigo-600" /> Your address book
            </h1>
            <p className="text-slate-500 mt-1">
              Manage saved shipping addresses and choose which one should be used by default.
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setMessage("");
              setError("");
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold shadow hover:bg-indigo-700 transition"
          >
            <Plus size={18} /> Add new address
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[2fr,1fr] gap-6">
          <div className="space-y-4">
            {loading ? (
              <div className="bg-white rounded-xl shadow p-6 text-center text-slate-500">
                Loading addresses...
              </div>
            ) : hasAddresses ? (
              addresses.map((address) => (
                <div
                  key={address._id}
                  className={`bg-white rounded-xl shadow-sm border transition hover:shadow-md ${
                    address.isDefault ? 'border-indigo-400' : 'border-slate-200'
                  }`}
                >
                  <div className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-slate-800">
                          {address.label || 'Saved address'}
                        </h3>
                        {address.isDefault && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-indigo-100 text-indigo-600 text-xs font-medium">
                            <Star size={14} /> Default
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-slate-600 space-y-1">
                        {address.recipientName && <div>{address.recipientName}</div>}
                        {address.phone && <div>{address.phone}</div>}
                        <div>
                          {[address.street, address.city, address.state, address.postalCode, address.country]
                            .filter(Boolean)
                            .join(', ')}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => handleEdit(address)}
                        className="inline-flex items-center gap-1 px-3 py-2 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                      >
                        <Edit size={16} /> Edit
                      </button>
                      {!address.isDefault && (
                        <button
                          onClick={() => handleSetDefault(address._id!)}
                          className="inline-flex items-center gap-1 px-3 py-2 text-sm rounded-lg border border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                          disabled={submitting}
                        >
                          <Star size={16} /> Set default
                        </button>
                      )}
                      <button
                        onClick={() => handleArchive(address._id!)}
                        className="inline-flex items-center gap-1 px-3 py-2 text-sm rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50"
                        disabled={submitting}
                      >
                        <Trash2 size={16} /> Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-xl shadow p-6 text-center text-slate-500">
                You do not have any saved addresses yet. Add one to speed up checkout.
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-slate-800">
                {mode === 'edit' ? 'Update address' : 'Add address'}
              </h2>
              {mode === 'edit' && (
                <button
                  onClick={resetForm}
                  className="text-slate-400 hover:text-slate-600"
                  aria-label="Cancel editing"
                >
                  <X size={18} />
                </button>
              )}
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Address label</label>
                <input
                  name="label"
                  value={formData.label || ''}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  placeholder="Home, Office..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Recipient</label>
                <input
                  name="recipientName"
                  value={formData.recipientName || ''}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  placeholder="Full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Phone number</label>
                <input
                  name="phone"
                  value={formData.phone || ''}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  placeholder="0123456789"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Street address</label>
                <input
                  name="street"
                  value={formData.street}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  placeholder="House number, street..."
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">City</label>
                  <input
                    name="city"
                    value={formData.city || ''}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">State/Province</label>
                  <input
                    name="state"
                    value={formData.state || ''}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Postal code</label>
                  <input
                    name="postalCode"
                    value={formData.postalCode || ''}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Country</label>
                  <input
                    name="country"
                    value={formData.country || ''}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                </div>
              </div>
              <label className="inline-flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  name="isDefault"
                  checked={Boolean(formData.isDefault)}
                  onChange={handleChange}
                />
                Set as default address
              </label>
              {error && (
                <div className="bg-rose-100 border border-rose-200 text-rose-600 px-3 py-2 rounded-lg text-sm">
                  {error}
                </div>
              )}
              {message && (
                <div className="bg-emerald-100 border border-emerald-200 text-emerald-600 px-3 py-2 rounded-lg text-sm">
                  {message}
                </div>
              )}
              <button
                type="submit"
                className="w-full inline-flex justify-center items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold shadow hover:bg-indigo-700 transition"
                disabled={submitting}
              >
                {submitting ? 'Saving...' : mode === 'edit' ? (<><Save size={18} /> Save changes</>) : (<><Save size={18} /> Save address</>)}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddressBookPage;

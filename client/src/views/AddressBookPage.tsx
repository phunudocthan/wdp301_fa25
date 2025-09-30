import React, { useEffect, useMemo, useState } from "react";
import { MapPin, Plus, Star, Edit, Trash2, Save, X } from "lucide-react";
import {
  getAddresses,
  createAddress,
  updateAddress,
  setDefaultAddress,
  archiveAddress,
  AddressPayload,
} from "../api/user";
import type { UserAddress } from "../types/user";
import Header from "../components/common/Header";
import "../styles/AddressBookPage.scss";

const emptyAddressForm: AddressPayload = {
  label: "",
  recipientName: "",
  phone: "",
  street: "",
  city: "",
  state: "",
  country: "Vietnam",
  isDefault: false,
};

const AddressBookPage: React.FC = () => {
  // luôn khởi tạo [] để không lỗi prev is not iterable
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [formData, setFormData] = useState<AddressPayload>({ ...emptyAddressForm });
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");

  const hasAddresses = useMemo(() => addresses.length > 0, [addresses]);

  // 📌 Lấy danh sách địa chỉ khi load

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const res = await getAddresses();
      console.log("Fetched addresses:", res);

      setAddresses(Array.isArray(res.addresses) ? res.addresses : []);
    } catch (err) {
      console.error("Failed to load addresses:", err);
      setError("Failed to load addresses. Please try again.");
      setAddresses([]);
    } finally {
      setLoading(false);
    }
  }; useEffect(() => {
    fetchAddresses();
  }, []);

  // 📌 Xử lý thay đổi input
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // 📌 Sửa địa chỉ
  const handleEdit = (address: UserAddress) => {
    setMode("edit");

    setEditingId(address._id!);
    setFormData({
      label: address.label || "",
      recipientName: address.recipientName,
      phone: address.phone,
      street: address.street,
      city: address.city || "",
      state: address.state || "",
      country: address.country || "Vietnam",
      isDefault: address.isDefault || false,
    });
    setMessage("");
    setError("");
  };

  // 📌 Gửi form (thêm hoặc cập nhật)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      if (mode === "create") {
        const newAddress = await createAddress(formData);
        setAddresses((prev) => [...(prev || []), newAddress]);
        setMessage("Address added successfully!");
      } else if (mode === "edit" && editingId) {
        const updated = await updateAddress(editingId, formData);
        fetchAddresses();

        setAddresses((prev) =>
          (prev || []).map((addr) => (addr._id === editingId ? updated : addr))
        );
        setMessage("Address updated successfully!");
      }
      setFormData({ ...emptyAddressForm });
      setMode("create");
      setEditingId(null);
    } catch (err) {
      console.error("Error saving address:", err);
      setError("Failed to save address. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // 📌 Đặt địa chỉ mặc định
  const handleSetDefault = async (id: string) => {
    try {
      await setDefaultAddress(id);
      setAddresses((prev) =>
        (prev || []).map((addr) => ({ ...addr, isDefault: addr._id === id }))
      );
      setMessage("Default address set successfully!");
    } catch (err) {
      console.error("Error setting default:", err);
      setError("Failed to set default address.");
    }
  };

  // 📌 Xoá/Archive địa chỉ
  const handleArchive = async (id: string) => {
    try {
      await archiveAddress(id);
      setAddresses((prev) => (prev || []).filter((addr) => addr._id !== id));
      setMessage("Address removed successfully!");
    } catch (err) {
      console.error("Error archiving address:", err);
      setError("Failed to remove address.");
    }
  };

  return (
    <>
      <Header />
      <div className="address-page">
        <div className="address-header">
          <div>
            <h1>
              <MapPin /> Your address book
            </h1>
            <p>Manage saved shipping addresses and choose default.</p>
          </div>
          <button
            className="btn-primary"
            onClick={() => {
              setFormData({ ...emptyAddressForm });
              setMode("create");
              setMessage("");
              setError("");
            }}
          >
            <Plus size={18} /> Add new address
          </button>
        </div>

        <div className="address-content">
          <div className="address-list">
            {loading ? (
              <div className="card info">Loading addresses...</div>
            ) : hasAddresses ? (
              addresses.map((address) => (
                <div
                  key={address._id}
                  className={`card address-card ${address.isDefault ? "default" : ""
                    }`}
                >
                  <div className="address-info">
                    <h3>
                      {address.label || "Saved address"}
                      {address.isDefault && (
                        <span className="tag-default">
                          <Star size={14} /> Default
                        </span>
                      )}
                    </h3>
                    <p>{address.recipientName}</p>
                    <p>{address.phone}</p>
                    <p>
                      {[address.street, address.city, address.state, address.country]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  </div>
                  <div className="address-actions">
                    <button
                      // className="btn-icon"
                      onClick={() => handleEdit(address)}
                    >
                      <Edit size={16} /> Edit
                    </button>
                    {!address.isDefault && (
                      <button
                        className="btn-icon success"
                        onClick={() => handleSetDefault(address._id!)}
                      >
                        <Star size={16} /> Default
                      </button>
                    )}
                    <button
                      className="btn-icon danger"
                      onClick={() => handleArchive(address._id!)}
                    >
                      <Trash2 size={16} /> Remove
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="card info">No saved addresses yet.</div>
            )}
          </div>

          <div className="address-form card">
            <div className="form-header">
              <h2>{mode === "edit" ? "Update address" : "Add address"}</h2>
              {mode === "edit" && (
                <button
                  className="btn-icon"
                  onClick={() => {
                    setMode("create");
                    setFormData({ ...emptyAddressForm });
                  }}
                >
                  <X size={18} />
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit}>
              <label>
                Label
                <input
                  name="label"
                  value={formData.label}
                  onChange={handleChange}
                />
              </label>
              <label>
                Recipient
                <input
                  name="recipientName"
                  value={formData.recipientName}
                  onChange={handleChange}
                />
              </label>
              <label>
                Phone <span className="required">*</span>
                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </label>
              <label>
                Street
                <input
                  name="street"
                  value={formData.street}
                  onChange={handleChange}
                  required
                />
              </label>
              <div className="grid-2">
                <label>
                  City
                  <input
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                  />
                </label>
                <label>
                  State
                  <input
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                  />
                </label>
              </div>
              <label>
                Country
                <input
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                />
              </label>
              <label className="checkbox">
                <input
                  type="checkbox"
                  name="isDefault"
                  checked={formData.isDefault}
                  onChange={handleChange}
                />{" "}
                Set as default
              </label>

              {error && <div className="alert error">{error}</div>}
              {message && <div className="alert success">{message}</div>}

              <button type="submit" className="btn-primary" disabled={submitting}>
                <Save size={18} />{" "}
                {mode === "edit" ? "Save changes" : "Save address"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default AddressBookPage;

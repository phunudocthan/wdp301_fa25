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
import "../styles/AddressBookPage.scss";
import { Button } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import Footer from "../components/common/Footer";

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
  const [formData, setFormData] = useState<AddressPayload>({
    ...emptyAddressForm,
  });
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

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
  };
  useEffect(() => {
    fetchAddresses();
  }, []);

  // 📌 Xử lý thay đổi input
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const target = e.target as HTMLInputElement | HTMLSelectElement;
    const { name, value, type } = target;
    const checked = (target as HTMLInputElement).checked;
    // sanitize phone: allow +84 or 84 prefixes, normalize to 0xxxxxxxxx
    const normalizePhone = (raw: string) => {
      if (!raw) return "";
      let digits = String(raw).replace(/\D/g, "");
      // if starts with country code 84 (or +84) -> remove leading 84 and add 0
      if (digits.startsWith("84") && digits.length > 2) {
        digits = "0" + digits.slice(2);
      }
      // if it already starts with 0 keep it
      if (!digits.startsWith("0") && digits.length === 9) {
        // maybe missing leading 0
        digits = "0" + digits;
      }
      return digits.slice(0, 10);
    };

    const newValue =
      name === "phone"
        ? normalizePhone(String(value))
        : type === "checkbox"
          ? checked
          : value;
    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));

    // inline validate this field
    const fieldError = validateField(name, newValue);
    setFieldErrors((prev) => {
      const copy = { ...prev };
      if (fieldError) copy[name] = fieldError;
      else delete copy[name];
      return copy;
    });
  };

  // validate helpers
  const phoneRegex = /^0\d{9}$/;
  const validateField = (name: string, value: any) => {
    const v = value === undefined || value === null ? "" : String(value);
    if (name === "recipientName") {
      if (!v.trim()) return "Recipient name is required";
    }
    if (name === "phone") {
      if (!v.trim()) return "Phone is required";
      if (!phoneRegex.test(v))
        return "Phone must be 10 digits and start with 0";
    }
    if (name === "street") {
      if (!v.trim()) return "Street is required";
    }
    if (name === "city") {
      if (!v.trim()) return "City is required";
    }
    if (name === "country") {
      if (!v.trim()) return "Country is required";
    }
    if (name === "label") {
      if (v.length > 50) return "Label must be 50 characters or less";
    }
    if (name === "state") {
      if (v.length > 50) return "State must be 50 characters or less";
    }
    return "";
  };

  const validateAll = (data: AddressPayload) => {
    const errors: Record<string, string> = {};
    const r = validateField("recipientName", data.recipientName);
    if (r) errors.recipientName = r;
    const p = validateField("phone", data.phone);
    if (p) errors.phone = p;
    const s = validateField("street", data.street);
    if (s) errors.street = s;
    const c = validateField("city", data.city || "");
    if (c) errors.city = c;
    const co = validateField("country", data.country || "");
    if (co) errors.country = co;
    const l = validateField("label", data.label || "");
    if (l) errors.label = l;
    return errors;
  };

  const isFormValid =
    Object.keys(fieldErrors).length === 0 &&
    !!formData.recipientName &&
    phoneRegex.test(String(formData.phone)) &&
    !!formData.street &&
    !!formData.city &&
    !!formData.country;

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
    // final validation
    const errors = validateAll(formData);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      // focus first invalid
      const first = Object.keys(errors)[0];
      const el = document.getElementsByName(first)[0] as
        | HTMLElement
        | undefined;
      if (el && typeof el.focus === "function") el.focus();
      setSubmitting(false);
      return;
    }

    try {
      if (mode === "create") {
        const result = await createAddress(formData);
        setAddresses((prev) => [...(prev || []), result.address]);
        setMessage("Address added successfully!");
      } else if (mode === "edit" && editingId) {
        const payload: Partial<AddressPayload> & { setAsDefault?: boolean } = {
          ...formData,
        };
        if (formData.isDefault) payload.setAsDefault = true;
        const result = await updateAddress(editingId, payload);
        fetchAddresses();
        setAddresses((prev) =>
          (prev || []).map((addr) =>
            addr._id === editingId ? result.address : addr
          )
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
    setActionLoading(true);
    try {
      await setDefaultAddress(id);
      setAddresses((prev) =>
        (prev || []).map((addr) => ({ ...addr, isDefault: addr._id === id }))
      );
      setMessage("Default address set successfully!");
    } catch (err) {
      console.error("Error setting default:", err);
      setError("Failed to set default address.");
    } finally {
      setActionLoading(false);
    }
  };

  // 📌 Xoá/Archive địa chỉ
  // archive flow handled via confirm modal (openConfirm -> confirmRemove)

  // inline confirm target (shows small bubble next to Remove)
  const [confirmTarget, setConfirmTarget] = useState<{
    id: string;
    label?: string;
  } | null>(null);

  const openConfirm = (id: string, label?: string) => {
    setConfirmTarget({ id, label });
  };

  const closeConfirm = () => setConfirmTarget(null);

  const confirmRemove = async () => {
    if (!confirmTarget) return;
    const id = confirmTarget.id;
    setActionLoading(true);
    try {
      await archiveAddress(id);
      setAddresses((prev) => (prev || []).filter((addr) => addr._id !== id));
      setMessage("Address removed successfully!");
    } catch (err) {
      console.error("Error archiving address:", err);
      setError("Failed to remove address.");
    } finally {
      setActionLoading(false);
      setConfirmTarget(null);
    }
  };

  return (
    <> 
    <Button type="link" style={{ marginBottom: 24 }} onClick={() => window.history.back()}>
          <ArrowLeftOutlined />

        </Button>
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
                      {[
                        address.street,
                        address.city,
                        address.state,
                        address.country,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  </div>
                  <div className="address-actions">
                    <div className="action-row">
                      <button
                        className="btn btn-edit"
                        onClick={() => handleEdit(address)}
                      >
                        <Edit size={16} /> Edit
                      </button>
                      {!address.isDefault && (
                        <button
                          className="btn btn-default"
                          onClick={() => handleSetDefault(address._id!)}
                          disabled={actionLoading}
                        >
                          <Star size={14} /> Default
                        </button>
                      )}
                      <div style={{ position: "relative" }}>
                        <button
                          className="btn btn-remove"
                          onClick={() =>
                            openConfirm(address._id!, address.label)
                          }
                          disabled={actionLoading}
                        >
                          <Trash2 size={14} /> Remove
                        </button>
                        {confirmTarget?.id === address._id && (
                          <div className="confirm-bubble">
                            <div className="confirm-text">
                              Remove "{confirmTarget?.label || ""}"?
                            </div>
                            <div className="confirm-actions">
                              <button
                                className="btn btn-default"
                                onClick={() => closeConfirm()}
                                disabled={actionLoading}
                              >
                                Cancel
                              </button>
                              <button
                                className="btn btn-remove"
                                onClick={() => confirmRemove()}
                                disabled={actionLoading}
                              >
                                Yes
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
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
              <label htmlFor="label">
                Label
                <input
                  id="label"
                  name="label"
                  value={formData.label}
                  onChange={handleChange}
                  placeholder="Home, Office, etc."
                  maxLength={50}
                />
              </label>

              <label htmlFor="recipientName">
                Recipient <span className="required"></span>
                <input
                  id="recipientName"
                  name="recipientName"
                  value={formData.recipientName}
                  onChange={handleChange}
                  placeholder="Full name"
                  aria-invalid={!!fieldErrors.recipientName}
                />
                {fieldErrors.recipientName && (
                  <div className="field-error">{fieldErrors.recipientName}</div>
                )}
              </label>

              <label htmlFor="phone">
                Phone <span className="required"></span>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="0xxxxxxxxx"
                  aria-invalid={!!fieldErrors.phone}
                  maxLength={10}
                  required
                />
                {fieldErrors.phone && (
                  <div className="field-error">{fieldErrors.phone}</div>
                )}
              </label>

              <label htmlFor="street">
                Street <span className="required"></span>
                <input
                  id="street"
                  name="street"
                  value={formData.street}
                  onChange={handleChange}
                  placeholder="123 Example St"
                  aria-invalid={!!fieldErrors.street}
                />
                {fieldErrors.street && (
                  <div className="field-error">{fieldErrors.street}</div>
                )}
              </label>

              <div className="grid-2">
                <label htmlFor="city">
                  City
                  <input
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Hanoi"
                    aria-invalid={!!fieldErrors.city}
                    required
                    maxLength={100}
                  />
                  {fieldErrors.city && (
                    <div className="field-error">{fieldErrors.city}</div>
                  )}
                </label>
                <label htmlFor="state">
                  State
                  <input
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="District / Province"
                    maxLength={50}
                  />
                  {fieldErrors.state && (
                    <div className="field-error">{fieldErrors.state}</div>
                  )}
                </label>
              </div>

              <div className="grid-2">
                <label htmlFor="country">
                  Country
                  <input
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    placeholder="Vietnam"
                    aria-invalid={!!fieldErrors.country}
                    required
                    maxLength={100}
                  />
                  {fieldErrors.country && (
                    <div className="field-error">{fieldErrors.country}</div>
                  )}
                </label>
                <div className="align-self-center"></div>
              </div>

              <label className="checkbox">
                <input
                  type="checkbox"
                  name="isDefault"
                  checked={!!formData.isDefault}
                  onChange={handleChange}
                />{" "}
                Set as default
              </label>

              {error && <div className="alert error">{error}</div>}
              {message && <div className="alert success">{message}</div>}

              <div className="help">Phone format: 0xxxxxxxxx</div>

              <button
                type="submit"
                className="btn-primary"
                disabled={submitting || !isFormValid}
              >
                <Save size={18} />{" "}
                {mode === "edit" ? "Save changes" : "Save address"}
              </button>
            </form>
          </div>
        </div>
      </div>
      <Footer/>
      {/* inline confirm bubbles are rendered next to each Remove button */}
    </>
  );
};

export default AddressBookPage;

// Note: modal markup is rendered inside component; exported here just for completeness

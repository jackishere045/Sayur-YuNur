import React, { useEffect } from "react";
import { X, MessageCircle } from "lucide-react";
import Swal from "sweetalert2";
import { useForm, ValidationError } from "@formspree/react";

const FeedbackModal = ({ isOpen, onClose }) => {
  const [state, handleSubmit, reset] = useForm("xandaljb");

  useEffect(() => {
    if (state.succeeded) {
      Swal.fire({
        title: "Terima kasih!",
        text: "Saran & masukan Anda telah dikirim.",
        icon: "success",
        confirmButtonColor: "#22c55e",
        timer: 2000,
        timerProgressBar: true
      }).then(() => {
        reset(); // reset form supaya bisa submit lagi
        onClose(); // tutup modal
      });
    }
  }, [state.succeeded, onClose, reset]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center sm:justify-center">
      <div className="bg-white w-full sm:w-96 sm:max-w-lg max-h-[90vh] sm:rounded-lg overflow-y-auto p-6 pb-24">
        {/* Header */}
        <div className="sticky top-0 bg-white p-4 border-b shadow-sm flex justify-between items-center">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <MessageCircle className="text-green-600" size={20} /> Saran & Masukan
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-1">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="text"
              name="name"
              placeholder="Nama"
              required
              className="border p-2 rounded"
            />
            <ValidationError prefix="Name" field="name" errors={state.errors} />

            <input
              type="email"
              name="email"
              placeholder="Email"
              required
              className="border p-2 rounded"
            />
            <ValidationError prefix="Email" field="email" errors={state.errors} />

            <textarea
              name="message"
              placeholder="Masukkan pesan"
              required
              className="border p-2 rounded"
            />
            <ValidationError prefix="Message" field="message" errors={state.errors} />

            <button
              type="submit"
              disabled={state.submitting}
              className="bg-green-600 text-white p-2 rounded hover:bg-green-700"
            >
              Kirim
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FeedbackModal;

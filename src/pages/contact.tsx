import React, { useState, useRef } from "react";
import emailjs from "@emailjs/browser";

// Environment Variables
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;

const Contact = () => {
  const form = useRef();
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sendEmail = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus("Sending...");

    emailjs
      .sendForm(SERVICE_ID, TEMPLATE_ID, form.current, PUBLIC_KEY)
      .then(() => {
        setStatus("Message sent successfully! 🎉");
        form.current.reset();

        setTimeout(() => setStatus(""), 5000);
      })
      .catch((error) => {
        console.error("EmailJS Error:", error);
        setStatus("❌ Failed to send message. Please try again.");

        setTimeout(() => setStatus(""), 5000);
      })
      .finally(() => setIsSubmitting(false));
  };

  return (
    <section id="contact" className="bg-gray-900 py-24 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Title */}
        <h2 className="text-center text-4xl md:text-5xl font-extrabold text-white mb-4">
          Get in <span className="text-cyan-400">Touch</span>
        </h2>

        <p className="text-center text-gray-400 mb-12 max-w-lg mx-auto">
          Have a question, suggestion, or collaboration idea?  
          Send me a message — I reply within 24 hours.
        </p>

        {/* Contact Form */}
        <form
          ref={form}
          onSubmit={sendEmail}
          className="bg-gray-800 p-8 md:p-10 rounded-2xl shadow-xl border border-gray-700"
        >
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-300 mb-2 text-sm">Your Name</label>
              <input
                type="text"
                name="from_name"
                placeholder="John Doe"
                required
                className="w-full p-3 bg-gray-700 rounded-lg text-white border border-transparent focus:outline-none focus:border-cyan-400 transition"
              />
            </div>

            <div>
              <label className="block text-gray-300 mb-2 text-sm">Email Address</label>
              <input
                type="email"
                name="from_email"
                placeholder="john@example.com"
                required
                className="w-full p-3 bg-gray-700 rounded-lg text-white border border-transparent focus:outline-none focus:border-cyan-400 transition"
              />
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-gray-300 mb-2 text-sm">Phone (optional)</label>
            <input
              type="tel"
              name="phone"
              placeholder="+91 9876543210"
              className="w-full p-3 bg-gray-700 rounded-lg text-white border border-transparent focus:outline-none focus:border-cyan-400 transition"
            />
          </div>

          <div className="mt-6">
            <label className="block text-gray-300 mb-2 text-sm">Message</label>
            <textarea
              name="message"
              rows="5"
              placeholder="Write your message here..."
              required
              className="w-full p-3 bg-gray-700 rounded-lg text-white border border-transparent focus:outline-none focus:border-cyan-400 transition"
            ></textarea>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full mt-8 py-3 rounded-lg font-semibold text-black 
            ${isSubmitting ? "bg-gray-600 cursor-not-allowed" : "bg-cyan-400 hover:bg-cyan-300"} 
            transition`}
          >
            {isSubmitting ? "Sending..." : "Send Message"}
          </button>

          {status && (
            <p className="text-center text-gray-200 mt-4">{status}</p>
          )}
        </form>

        {/* Direct Email */}
        <div className="text-center mt-8">
          <p className="text-gray-400 text-sm">
            Or email directly:{" "}
            <span className="text-cyan-400 font-medium">
              support@insightiqo.com
            </span>
          </p>
        </div>
      </div>
    </section>
  );
};

export default Contact;

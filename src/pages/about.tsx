import React from "react";

const AboutPage = () => {
  return (
    <section className="min-h-screen bg-gray-900 text-white py-20 px-6">
      <div className="max-w-6xl mx-auto">

        {/* Heading */}
        <h1 className="text-4xl md:text-5xl font-extrabold text-center mb-6">
          About <span className="text-cyan-400">InsightIQO</span>
        </h1>

        <p className="text-center text-gray-300 max-w-3xl mx-auto text-lg mb-12">
          InsightIQO is an AI-powered analytics platform designed to make data 
          understanding accessible to everyone — from students and analysts to 
          business owners and decision-makers.
        </p>

        {/* Main Content Section */}
        <div className="grid md:grid-cols-2 gap-12 items-center">

          {/* Left text block */}
          <div>
            <h2 className="text-2xl font-bold mb-4 text-cyan-400">
              Our Mission
            </h2>
            <p className="text-gray-300 mb-6">
              We believe that data should empower people, not overwhelm them.
              InsightIQO transforms raw datasets into clear insights, 
              interactive dashboards, and AI-generated summaries — instantly.
            </p>

            <h2 className="text-2xl font-bold mb-4 text-cyan-400">
              What We Do
            </h2>
            <ul className="text-gray-300 space-y-3">
              <li>✔ AI-powered data analysis</li>
              <li>✔ Automatic dashboards & visualizations</li>
              <li>✔ No coding or analytics skills required</li>
              <li>✔ Smart insights for better decision-making</li>
              <li>✔ Fast, intuitive and user-friendly interface</li>
            </ul>
          </div>

          {/* Right illustration block */}
          <div className="bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-700">
            <h3 className="text-xl font-semibold mb-4">Why InsightIQO?</h3>
            <p className="text-gray-300 mb-4">
              Traditional data tools are complex and time-consuming. 
              InsightIQO simplifies everything:
            </p>

            <ul className="text-gray-300 space-y-2">
              <li>📊 Upload your dataset</li>
              <li>🤖 Enter a simple text prompt</li>
              <li>⚡ AI generates insights and charts for you</li>
              <li>📁 Download reports instantly</li>
            </ul>

            <p className="text-gray-300 mt-4">
              It’s like having a personal data analyst — available anytime.
            </p>
          </div>
        </div>

        {/* Vision Section */}
        <div className="mt-20 bg-gray-800 p-10 rounded-2xl border border-gray-700">
          <h2 className="text-3xl font-bold text-cyan-400 mb-4">Our Vision</h2>
          <p className="text-gray-300 text-lg">
            To build the world’s simplest and smartest AI-driven analytics 
            assistant — helping millions of people turn data into meaningful 
            decisions with zero complexity.
          </p>
        </div>

      </div>
    </section>
  );
};

export default AboutPage;

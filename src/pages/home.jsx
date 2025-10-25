import React, { useState } from "react";

function Homepage() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    location: "",
    education: "",
    experienceLevel: "",
    skills: "",
    jobDescription: "",
  });
  const [generatedResume, setGeneratedResume] = useState("");

  async function handleGenerateData() {
    // Build a concise prompt from the form data
    const prompt = `Generate a professional, ATS-friendly resume for ${formData.fullName || "[Candidate]"}.\n\nProfile:\nEmail: ${formData.email}\nPhone: ${formData.phone}\nLocation: ${formData.location}\nEducation: ${formData.education}\nExperience: ${formData.experienceLevel}\nSkills: ${formData.skills}\n\nJob description:\n${formData.jobDescription}\n\nPlease produce a resume in plain text with clear section headings.`;
    // POST to local server proxy which will hold the API key securely
    try {
      const response = await fetch("http://localhost:5174/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formData, prompt }),
      });
      const data = await response.json();
      // server returns { text, raw }
      setGeneratedResume(data.text || JSON.stringify(data.raw || data, null, 2));
    } catch (error) {
      console.error(error);
      setGeneratedResume("Error generating resume. See console for details.");
    }
  }

  // Update form data when inputs change. Uses the input/select/textarea id to map to state keys.
  function handleChange(e) {
    const { id, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;
    setFormData((prev) => ({ ...prev, [id]: newValue }));
  }

  // Handle form submit: prevent default and trigger data generation
  function handleSubmit(e) {
    e.preventDefault();
    // Here you can validate formData or pass it to the API payload
    handleGenerateData();
  }

  // Parse plain-text resume into simple sections for nicer rendering
  function parseResume(text) {
    if (!text) return [];
    // If it's JSON, try to parse and turn keys into sections
    const trimmed = text.trim();
    if ((trimmed.startsWith("{") || trimmed.startsWith("["))) {
      try {
        const obj = JSON.parse(trimmed);
        if (typeof obj === "string") return [{ title: "Resume", lines: [obj] }];
        if (Array.isArray(obj)) {
          return obj.map((item, i) => ({ title: `Item ${i + 1}`, lines: [JSON.stringify(item, null, 2)] }));
        }
        return Object.keys(obj).map((k) => ({ title: k, lines: [typeof obj[k] === "string" ? obj[k] : JSON.stringify(obj[k], null, 2)] }));
      } catch {
        // fall through to plain text parser
      }
    }

    const lines = text.split(/\r?\n/).map((l) => l.trim());
    const sections = [];
    let current = { title: "Summary", lines: [] };

    function pushCurrent() {
      if (current.lines.length) sections.push(current);
      current = { title: "", lines: [] };
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line) {
        // blank line -> separate paragraphs
        if (current.title || current.lines.length) {
          // keep blank to separate paragraphs inside lines
          current.lines.push("");
        }
        continue;
      }

      // Heading heuristics: line ends with ':' or is all uppercase and short
  if (/:$/.test(line) || (/^[A-Z0-9 -]{2,60}$/.test(line) && line === line.toUpperCase())) {
        // start new section
        if (current.title || current.lines.length) pushCurrent();
        current.title = line.replace(/:$/, "");
        continue;
      }

      // list item?
      if (/^[-*•]\s+/.test(line) || /^\d+[.)]\s+/.test(line)) {
        current.lines.push(line.replace(/^[-*•]\s+|^\d+[.)]\s+/, "- "));
        continue;
      }

      // regular content
      current.lines.push(line);
    }

    if (current.title || current.lines.length) sections.push(current);
    return sections;
  }

  return (
    <div className="container my-5">
      <div className="card shadow p-4">
        <div className="card-body">
          <h2 className="text-center mb-4 text-primary fw-bold">
            Resume Builder
          </h2>
          <p className="text-center text-muted mb-4">
            Fill in your details and job description — Gemini AI will create a
            professional resume for you.
          </p>

          <form onSubmit={handleSubmit}>
            {/* Personal Information */}
            <h5 className="mb-3 text-secondary">Personal Information</h5>
            <div className="row mb-3">
              <div className="col-md-6 mb-3">
                <label htmlFor="fullName" className="form-label">
                  Full Name
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div className="col-md-6 mb-3">
                <label htmlFor="email" className="form-label">
                  Email Address
                </label>
                <input
                  type="email"
                  className="form-control"
                  id="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-6 mb-3">
                <label htmlFor="phone" className="form-label">
                  Phone Number
                </label>
                <input
                  type="tel"
                  className="form-control"
                  id="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter your phone number"
                  required
                />
              </div>

              <div className="col-md-6 mb-3">
                <label htmlFor="location" className="form-label">
                  Location
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Enter your city or state"
                />
              </div>
            </div>

            {/* Education */}
            <h5 className="mb-3 text-secondary mt-4">Education</h5>
            <div className="mb-3">
              <label htmlFor="education" className="form-label">
                Highest Qualification
              </label>
              <input
                type="text"
                className="form-control"
                id="education"
                value={formData.education}
                onChange={handleChange}
                placeholder="e.g., B.Tech in Computer Science"
              />
            </div>

            {/* Experience */}
            <h5 className="mb-3 text-secondary mt-4">Experience</h5>
            <div className="mb-3">
              <label htmlFor="experienceLevel" className="form-label">
                Experience Level
              </label>
              <select
                className="form-select"
                id="experienceLevel"
                value={formData.experienceLevel}
                onChange={handleChange}
              >
                <option value="">Select your experience</option>
                <option value="fresher">Fresher</option>
                <option value="1-3">1-3 Years</option>
                <option value="3-5">3-5 Years</option>
                <option value="5+">5+ Years</option>
              </select>
            </div>

            {/* Skills */}
            <h5 className="mb-3 text-secondary mt-4">Skills</h5>
            <div className="mb-3">
              <label htmlFor="skills" className="form-label">
                Key Skills
              </label>
              <textarea
                className="form-control"
                id="skills"
                rows="3"
                value={formData.skills}
                onChange={handleChange}
                placeholder="e.g., JavaScript, React, Node.js"
              ></textarea>
            </div>

            {/* Job Description */}
            <h5 className="mb-3 text-secondary mt-4">Job Description</h5>
            <div className="mb-4">
              <label htmlFor="jobDescription" className="form-label">
                Paste the job description of the role you’re applying for
              </label>
              <textarea
                className="form-control"
                id="jobDescription"
                rows="5"
                value={formData.jobDescription}
                onChange={handleChange}
                placeholder="Paste the job description here..."
              ></textarea>
              <small className="text-muted">
                Gemini AI will tailor your resume according to this job.
              </small>
            </div>

            {/* Submit */}
            <div className="d-grid">
              <button type="submit" className="btn btn-primary btn-lg">
                Generate Resume with Gemini AI
              </button>
            </div>
          </form>
          {generatedResume && (
            <div className="mt-4">
              <h5 className="mb-2">Generated Resume</h5>
              <div className="card">
                <div className="card-body">
                  {/* Render parsed sections with headings, paragraphs and lists */}
                  {(() => {
                    const sections = parseResume(generatedResume);
                    if (!sections.length) return <pre style={{ whiteSpace: "pre-wrap" }}>{generatedResume}</pre>;
                    return sections.map((sec, idx) => (
                      <section key={idx} className="mb-3">
                        {sec.title ? (
                          <h6 className="mb-2 text-secondary">{sec.title}</h6>
                        ) : null}
                        {sec.lines && sec.lines.length ? (
                          // detect if lines are list-like (start with '-')
                          /^-\s+/.test(sec.lines.find((l) => l)) ? (
                            <ul>
                              {sec.lines
                                .filter((l) => l && !/^\s*$/.test(l))
                                .map((l, i) => (
                                  <li key={i}>{l.replace(/^-\s+/, "")}</li>
                                ))}
                            </ul>
                          ) : (
                            // join lines into paragraphs separated by blank lines
                            sec.lines.join("\n").split(/\n\s*\n/).map((para, i) => (
                              <p key={i} className="mb-2" style={{ whiteSpace: "pre-wrap" }}>
                                {para.trim()}
                              </p>
                            ))
                          )
                        ) : null}
                      </section>
                    ));
                  })()}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Homepage;
"use client";

import { useMemo, useState } from "react";

const paidProofValue = "I have paid and uploaded proof";
const maxSourceScreenshotSize = 8 * 1024 * 1024;

const interests = [
  "ChatGPT",
  "Canva AI",
  "Graphic Design",
  "Video Editing",
  "Content Creation",
  "Website Design",
  "Mobile App Development",
  "Prompt Engineering",
  "Freelancing",
  "AI Automation",
  "Business Growth",
  "Social Media",
  "Excel AI",
  "Research",
  "Resume/CV",
  "Digital Marketing",
  "Other"
];

const devices = ["Android Phone", "iPhone", "Laptop", "Desktop", "Tablet"];

const initialForm = {
  fullName: "",
  gender: "",
  phoneNumber: "",
  whatsappNumber: "",
  emailAddress: "",
  state: "",
  country: "Nigeria",
  occupation: "",
  usedAiBefore: "",
  referralSource: "",
  interests: [],
  learningDevices: [],
  preferredSession: "",
  attendanceCommitment: "",
  paymentReadiness: "",
  expectations: "",
  agreements: [],
  website: ""
};

function formatNaira(amount) {
  return `₦${Number(amount || 0).toLocaleString("en-NG")}`;
}

function calculateCoursePricing(count) {
  if (count <= 0) {
    return {
      courseFee: 0,
      courseCount: 0,
      breakdown: "Choose at least 1 course to calculate your fee."
    };
  }

  if (count <= 3) {
    return {
      courseFee: 10000,
      courseCount: count,
      breakdown: `${count} course${count === 1 ? "" : "s"} selected. First 1-3 courses cost ₦10,000.`
    };
  }

  if (count === 4) {
    return {
      courseFee: 15000,
      courseCount: count,
      breakdown: "4 courses selected. Four-course package costs ₦15,000."
    };
  }

  const extraCourses = count - 4;
  return {
    courseFee: 15000 + extraCourses * 3000,
    courseCount: count,
    breakdown: `${count} courses selected. ₦15,000 for 4 courses + ${extraCourses} extra course${extraCourses === 1 ? "" : "s"} at ₦3,000 each.`
  };
}

function resizeScreenshot(file) {
  return new Promise((resolve, reject) => {
    const allowedTypes = ["image/png", "image/jpeg", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      reject(new Error("Use a PNG, JPG, or WebP payment screenshot."));
      return;
    }

    if (file.size > maxSourceScreenshotSize) {
      reject(new Error("Payment screenshot is too large. Use an image below 8 MB."));
      return;
    }

    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const maxEdge = 1400;
      const scale = Math.min(1, maxEdge / Math.max(image.naturalWidth, image.naturalHeight));
      const width = Math.max(1, Math.round(image.naturalWidth * scale));
      const height = Math.max(1, Math.round(image.naturalHeight * scale));
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      canvas.width = width;
      canvas.height = height;
      context.drawImage(image, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.78));
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not read the payment screenshot. Try another image."));
    };

    image.src = objectUrl;
  });
}

async function preparePaymentScreenshot(file) {
  if (!file) {
    return null;
  }

  const dataUrl = await resizeScreenshot(file);
  const [, data] = dataUrl.split(",");

  return {
    fileName: file.name.replace(/\.[^.]+$/, "") + ".jpg",
    mimeType: "image/jpeg",
    data,
    originalFileName: file.name,
    originalMimeType: file.type,
    originalSize: file.size
  };
}

export default function RegistrationForm() {
  const [formData, setFormData] = useState(initialForm);
  const [step, setStep] = useState(0);
  const [paymentScreenshot, setPaymentScreenshot] = useState(null);
  const [status, setStatus] = useState({ type: "", message: "", onboardingLink: "" });
  const [submitting, setSubmitting] = useState(false);
  const pricing = useMemo(() => calculateCoursePricing(formData.interests.length), [formData.interests.length]);
  const paymentProofRequired = formData.paymentReadiness === paidProofValue;

  function updateField(name, value) {
    setFormData((current) => ({
      ...current,
      [name]: value
    }));
  }

  function toggleList(name, value) {
    setFormData((current) => {
      const selected = new Set(current[name]);

      if (selected.has(value)) {
        selected.delete(value);
      } else {
        selected.add(value);
      }

      return {
        ...current,
        [name]: Array.from(selected)
      };
    });
  }

  function validateStep(targetStep) {
    if (targetStep === 0) {
      return formData.fullName && formData.gender && formData.phoneNumber && formData.whatsappNumber && formData.emailAddress && formData.state && formData.country && formData.occupation;
    }

    if (targetStep === 1) {
      return formData.usedAiBefore && formData.referralSource;
    }

    if (targetStep === 2) {
      return formData.interests.length > 0;
    }

    if (targetStep === 3) {
      return formData.learningDevices.length > 0;
    }

    if (targetStep === 4) {
      return formData.preferredSession && formData.attendanceCommitment;
    }

    if (targetStep === 5) {
      return formData.paymentReadiness && (!paymentProofRequired || paymentScreenshot);
    }

    if (targetStep === 6) {
      return formData.expectations.trim();
    }

    return formData.agreements.length === 4;
  }

  function nextStep() {
    if (!validateStep(step)) {
      setStatus({ type: "error", message: "Complete the required fields in this step before continuing.", onboardingLink: "" });
      return;
    }

    setStatus({ type: "", message: "", onboardingLink: "" });
    setStep((current) => Math.min(current + 1, 7));
  }

  async function submitRegistration(event) {
    event.preventDefault();

    for (let index = 0; index < 8; index += 1) {
      if (!validateStep(index)) {
        setStep(index);
        setStatus({ type: "error", message: "Complete all required registration sections before submitting.", onboardingLink: "" });
        return;
      }
    }

    setSubmitting(true);
    setStatus({ type: "success", message: "Preparing your registration...", onboardingLink: "" });

    try {
      const payload = {
        ...formData,
        courseFee: pricing.courseFee,
        courseCount: pricing.courseCount,
        pricingBreakdown: pricing.breakdown,
        learningDevice: formData.learningDevices.join(", "),
        paymentScreenshot: await preparePaymentScreenshot(paymentScreenshot),
        pageUrl: window.location.href
      };

      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.ok) {
        throw new Error(result.message || "Registration could not be submitted.");
      }

      setFormData(initialForm);
      setPaymentScreenshot(null);
      setStep(0);
      setStatus({
        type: "success",
        message: `Congratulations! Your registration has been received. Your Student ID is ${result.studentId || "being generated"}.`,
        onboardingLink: result.onboardingLink || ""
      });
    } catch (error) {
      setStatus({
        type: "error",
        message: error.message || "Something went wrong. Please try again or contact the academy on WhatsApp.",
        onboardingLink: ""
      });
    } finally {
      setSubmitting(false);
    }
  }

  const steps = [
    "Personal",
    "About",
    "Courses",
    "Devices",
    "Schedule",
    "Payment",
    "Goals",
    "Agreement"
  ];

  return (
    <form className="registration-form" onSubmit={submitRegistration} noValidate>
      <input type="text" name="website" className="honeypot" tabIndex="-1" autoComplete="off" aria-hidden="true" value={formData.website} onChange={(event) => updateField("website", event.target.value)} />
      <div className="form-layout">
        <aside className="form-progress" aria-label="Registration progress">
          <ol>
            {steps.map((label, index) => (
              <li key={label} className={`progress-step ${index === step ? "is-active" : ""} ${index < step ? "is-complete" : ""}`}>
                <span>{index + 1}</span> {label}
              </li>
            ))}
          </ol>
        </aside>

        <div className="form-panel">
          {step === 0 && (
            <fieldset className="form-step is-active">
              <legend><span>Step 1 of 8</span> Personal Information</legend>
              <div className="field-grid">
                <label><span>Full Name *</span><input type="text" value={formData.fullName} onChange={(event) => updateField("fullName", event.target.value)} required /></label>
                <div className="field-group" role="radiogroup" aria-label="Gender">
                  <span>Gender *</span>
                  {["Male", "Female"].map((value) => <label key={value}><input type="radio" name="gender" checked={formData.gender === value} onChange={() => updateField("gender", value)} required /> {value}</label>)}
                </div>
                <label><span>Phone Number *</span><input type="tel" value={formData.phoneNumber} onChange={(event) => updateField("phoneNumber", event.target.value)} required /></label>
                <label><span>WhatsApp Number *</span><input type="tel" value={formData.whatsappNumber} onChange={(event) => updateField("whatsappNumber", event.target.value)} required /></label>
                <label><span>Email Address *</span><input type="email" value={formData.emailAddress} onChange={(event) => updateField("emailAddress", event.target.value)} required /></label>
                <label><span>State *</span><input type="text" value={formData.state} onChange={(event) => updateField("state", event.target.value)} required /></label>
                <label><span>Country *</span><input type="text" value={formData.country} onChange={(event) => updateField("country", event.target.value)} required /></label>
                <label><span>Occupation *</span><input type="text" value={formData.occupation} onChange={(event) => updateField("occupation", event.target.value)} required /></label>
              </div>
            </fieldset>
          )}

          {step === 1 && (
            <fieldset className="form-step is-active">
              <legend><span>Step 2 of 8</span> About You</legend>
              <div className="two-column">
                <div className="field-group" role="radiogroup" aria-label="Have you used AI before?">
                  <span>Have you used AI before? *</span>
                  {["Yes", "No", "A Little"].map((value) => <label key={value}><input type="radio" name="usedAiBefore" checked={formData.usedAiBefore === value} onChange={() => updateField("usedAiBefore", value)} required /> {value}</label>)}
                </div>
                <div className="field-group" role="radiogroup" aria-label="Referral source">
                  <span>How did you hear about this training? *</span>
                  {["Facebook", "WhatsApp", "Instagram", "LinkedIn", "Friend", "TikTok", "Other"].map((value) => <label key={value}><input type="radio" name="referralSource" checked={formData.referralSource === value} onChange={() => updateField("referralSource", value)} required /> {value}</label>)}
                </div>
              </div>
            </fieldset>
          )}

          {step === 2 && (
            <fieldset className="form-step is-active">
              <legend><span>Step 3 of 8</span> What Do You Want To Learn?</legend>
              <p className="field-note">Pick your course interests. The first 1-3 choices cost ₦10,000. Four choices cost ₦15,000. Every extra course after four adds ₦3,000.</p>
              <div className="course-picker-layout">
                <div className="checkbox-grid course-grid">
                  {interests.map((interest) => (
                    <label key={interest}><input type="checkbox" checked={formData.interests.includes(interest)} onChange={() => toggleList("interests", interest)} /> {interest}</label>
                  ))}
                </div>
                <aside className="price-summary" aria-live="polite">
                  <span>Selected Course Fee</span>
                  <strong>{formatNaira(pricing.courseFee)}</strong>
                  <p>{pricing.breakdown}</p>
                  <div className="selected-count"><b>{pricing.courseCount}</b> selected</div>
                  <ul>
                    {formData.interests.length === 0 ? <li>No courses selected yet.</li> : formData.interests.map((interest) => <li key={interest}>{interest}</li>)}
                  </ul>
                </aside>
              </div>
            </fieldset>
          )}

          {step === 3 && (
            <fieldset className="form-step is-active">
              <legend><span>Step 4 of 8</span> Learning Devices</legend>
              <p className="field-note">Select every device you can use for class. You can pick more than one.</p>
              <div className="field-group inline device-group" aria-label="Learning devices">
                {devices.map((device) => <label key={device}><input type="checkbox" checked={formData.learningDevices.includes(device)} onChange={() => toggleList("learningDevices", device)} /> {device}</label>)}
              </div>
            </fieldset>
          )}

          {step === 4 && (
            <fieldset className="form-step is-active">
              <legend><span>Step 5 of 8</span> Class Preference & Commitment</legend>
              <div className="two-column">
                <div className="field-group" role="radiogroup" aria-label="Preferred session">
                  <span>Preferred Session *</span>
                  {["Morning (10 AM)", "Evening (4 PM)", "Night (8 PM if introduced)"].map((value) => <label key={value}><input type="radio" name="preferredSession" checked={formData.preferredSession === value} onChange={() => updateField("preferredSession", value)} required /> {value}</label>)}
                </div>
                <div className="field-group" role="radiogroup" aria-label="Attendance commitment">
                  <span>Can you attend classes regularly? *</span>
                  {["Yes", "Mostly", "Sometimes"].map((value) => <label key={value}><input type="radio" name="attendanceCommitment" checked={formData.attendanceCommitment === value} onChange={() => updateField("attendanceCommitment", value)} required /> {value}</label>)}
                </div>
              </div>
            </fieldset>
          )}

          {step === 5 && (
            <fieldset className="form-step is-active">
              <legend><span>Step 6 of 8</span> Payment</legend>
              <div className="payment-total">
                <span>Your selected training fee</span>
                <strong>{formatNaira(pricing.courseFee)}</strong>
                <p>{pricing.breakdown}</p>
              </div>
              <p className="field-note">Pay the exact selected amount into the account below and upload your payment screenshot if you have already paid.</p>
              <div className="bank-details" aria-label="Payment bank details">
                <div><span>Bank Name</span><strong>Opay</strong></div>
                <div><span>Account Number</span><strong>8166563757</strong></div>
                <div><span>Account Holder</span><strong>Phiip Awazie</strong></div>
              </div>
              <div className="field-group inline" role="radiogroup" aria-label="Payment status">
                {[paidProofValue, "I need the one-week grace period", "I would like to discuss payment"].map((value) => (
                  <label key={value}><input type="radio" name="paymentReadiness" checked={formData.paymentReadiness === value} onChange={() => updateField("paymentReadiness", value)} required /> {value}</label>
                ))}
              </div>
              <div className="upload-panel">
                <label>
                  <span>Upload Payment Screenshot</span>
                  <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => setPaymentScreenshot(event.target.files?.[0] || null)} required={paymentProofRequired} />
                </label>
                <p className="field-note">{paymentProofRequired ? "Upload your Opay transfer screenshot before submitting." : "Optional unless you select payment proof uploaded."} PNG, JPG, or WebP is accepted.</p>
              </div>
            </fieldset>
          )}

          {step === 6 && (
            <fieldset className="form-step is-active">
              <legend><span>Step 7 of 8</span> Expectations</legend>
              <label>
                <span>What do you hope to achieve after this training? *</span>
                <textarea rows="7" value={formData.expectations} onChange={(event) => updateField("expectations", event.target.value)} required />
              </label>
            </fieldset>
          )}

          {step === 7 && (
            <fieldset className="form-step is-active">
              <legend><span>Step 8 of 8</span> Agreement</legend>
              <div className="agreement-list">
                {[
                  "I understand that this is a paid training program.",
                  "I agree to follow the class rules.",
                  "I understand that class materials are available after payment.",
                  "I agree to participate respectfully."
                ].map((agreement) => (
                  <label key={agreement}><input type="checkbox" checked={formData.agreements.includes(agreement)} onChange={() => toggleList("agreements", agreement)} required /> {agreement}</label>
                ))}
              </div>
              <div className="final-review">
                <span>Final selected fee</span>
                <strong>{formatNaira(pricing.courseFee)}</strong>
                <p>{pricing.breakdown}</p>
              </div>
            </fieldset>
          )}

          <div className="form-footer">
            <button className="button ghost-button" type="button" onClick={() => setStep((current) => Math.max(current - 1, 0))} disabled={step === 0}>Previous</button>
            <p className="privacy-note">Step {step + 1} of 8</p>
            {step < 7 ? (
              <button className="button primary" type="button" onClick={nextStep}>Next</button>
            ) : (
              <button className="button primary submit-button" type="submit" disabled={submitting}>{submitting ? "Submitting..." : "Submit Registration"}</button>
            )}
          </div>

          {status.message && (
            <div className={`form-status is-visible ${status.type}`} role="status" aria-live="polite">
              {status.message}
              {status.onboardingLink && <><br /><a href={status.onboardingLink} target="_blank" rel="noreferrer">Join the paid students WhatsApp class group</a></>}
            </div>
          )}
        </div>
      </div>
    </form>
  );
}

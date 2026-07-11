const form = document.querySelector("#registrationForm");
const statusBox = document.querySelector("#formStatus");
const formSteps = Array.from(form.querySelectorAll(".form-step"));
const progressSteps = Array.from(form.querySelectorAll(".progress-step"));
const previousButton = form.querySelector("[data-form-prev]");
const nextButton = form.querySelector("[data-form-next]");
const submitButton = form.querySelector(".submit-button");
const stepCounter = form.querySelector("#stepCounter");
const paymentRadios = Array.from(form.querySelectorAll('input[name="paymentReadiness"]'));
const screenshotInput = form.querySelector("#paymentScreenshot");
const screenshotHint = form.querySelector("#screenshotHint");
const interestInputs = Array.from(form.querySelectorAll('input[name="interests"]'));
const deviceInputs = Array.from(form.querySelectorAll('input[name="learningDevices"]'));
const courseFeeInput = form.querySelector("#courseFeeInput");
const courseCountInput = form.querySelector("#courseCountInput");
const pricingBreakdownInput = form.querySelector("#pricingBreakdownInput");
const selectedCourseFee = form.querySelector("#selectedCourseFee");
const selectedCourseCount = form.querySelector("#selectedCourseCount");
const selectedCourseList = form.querySelector("#selectedCourseList");
const pricingBreakdownText = form.querySelector("#pricingBreakdownText");
const paymentCourseFee = form.querySelector("#paymentCourseFee");
const paymentCourseBreakdown = form.querySelector("#paymentCourseBreakdown");
const finalCourseFee = form.querySelector("#finalCourseFee");
const finalCourseBreakdown = form.querySelector("#finalCourseBreakdown");

const paidProofValue = "I have paid and uploaded proof";
const maxSourceScreenshotSize = 8 * 1024 * 1024;
let currentStep = 0;

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

function setStatus(type, message) {
  if (!message) {
    statusBox.className = "form-status";
    statusBox.textContent = "";
    return;
  }

  statusBox.className = `form-status is-visible ${type}`;
  statusBox.textContent = message;
}

function getCheckedValues(formData, name) {
  return formData.getAll(name).filter(Boolean);
}

function selectedInterests() {
  return interestInputs.filter((input) => input.checked).map((input) => input.value);
}

function selectedDevices() {
  return deviceInputs.filter((input) => input.checked).map((input) => input.value);
}

function selectedPaymentValue() {
  return form.querySelector('input[name="paymentReadiness"]:checked')?.value || "";
}

function isPaymentProofRequired() {
  return selectedPaymentValue() === paidProofValue;
}

function updateScreenshotRequirement() {
  const required = isPaymentProofRequired();
  screenshotInput.required = required;
  screenshotInput.setCustomValidity("");
  screenshotHint.textContent = required
    ? "Upload your Opay transfer screenshot before submitting. PNG, JPG, or WebP is accepted."
    : "Optional unless you select “I have paid and uploaded proof”. PNG, JPG, or WebP is accepted.";
}

function updatePricing() {
  const courses = selectedInterests();
  const pricing = calculateCoursePricing(courses.length);

  courseFeeInput.value = String(pricing.courseFee);
  courseCountInput.value = String(pricing.courseCount);
  pricingBreakdownInput.value = pricing.breakdown;

  selectedCourseFee.textContent = formatNaira(pricing.courseFee);
  paymentCourseFee.textContent = formatNaira(pricing.courseFee);
  finalCourseFee.textContent = formatNaira(pricing.courseFee);
  selectedCourseCount.textContent = String(pricing.courseCount);
  pricingBreakdownText.textContent = pricing.breakdown;
  paymentCourseBreakdown.textContent = pricing.breakdown;
  finalCourseBreakdown.textContent = pricing.breakdown;

  selectedCourseList.innerHTML = "";

  if (courses.length === 0) {
    const item = document.createElement("li");
    item.textContent = "No courses selected yet.";
    selectedCourseList.appendChild(item);
    return;
  }

  courses.forEach((course) => {
    const item = document.createElement("li");
    item.textContent = course;
    selectedCourseList.appendChild(item);
  });
}

function setStepControlsDisabled(step, disabled) {
  step.querySelectorAll("input, select, textarea").forEach((control) => {
    control.disabled = disabled;
  });
}

function setAllStepControlsDisabled(disabled) {
  formSteps.forEach((step) => setStepControlsDisabled(step, disabled));
}

function setStep(index) {
  currentStep = Math.max(0, Math.min(index, formSteps.length - 1));

  formSteps.forEach((step, stepIndex) => {
    const active = stepIndex === currentStep;
    step.classList.toggle("is-active", active);
    setStepControlsDisabled(step, !active);
  });

  progressSteps.forEach((item, stepIndex) => {
    item.classList.toggle("is-active", stepIndex === currentStep);
    item.classList.toggle("is-complete", stepIndex < currentStep);
  });

  previousButton.disabled = currentStep === 0;
  nextButton.hidden = currentStep === formSteps.length - 1;
  submitButton.hidden = currentStep !== formSteps.length - 1;
  stepCounter.textContent = `Step ${currentStep + 1} of ${formSteps.length}`;
  setStatus("", "");
}

function validateStep(index) {
  const step = formSteps[index];
  updateScreenshotRequirement();

  if (index === 2 && selectedInterests().length === 0) {
    setStatus("error", "Select at least one course interest before continuing.");
    return false;
  }

  if (index === 3 && selectedDevices().length === 0) {
    setStatus("error", "Select at least one learning device before continuing.");
    return false;
  }

  if (index === 5 && isPaymentProofRequired() && screenshotInput.files.length === 0) {
    screenshotInput.setCustomValidity("Upload your payment screenshot before continuing.");
  }

  if (!step.checkValidity()) {
    step.reportValidity();
    return false;
  }

  screenshotInput.setCustomValidity("");
  return true;
}

function buildPayload(formElement) {
  const formData = new FormData(formElement);
  const pricing = calculateCoursePricing(getCheckedValues(formData, "interests").length);
  const learningDevices = getCheckedValues(formData, "learningDevices");

  return {
    fullName: formData.get("fullName")?.trim(),
    gender: formData.get("gender"),
    phoneNumber: formData.get("phoneNumber")?.trim(),
    whatsappNumber: formData.get("whatsappNumber")?.trim(),
    emailAddress: formData.get("emailAddress")?.trim(),
    state: formData.get("state")?.trim(),
    country: formData.get("country")?.trim(),
    occupation: formData.get("occupation")?.trim(),
    usedAiBefore: formData.get("usedAiBefore"),
    referralSource: formData.get("referralSource"),
    interests: getCheckedValues(formData, "interests"),
    learningDevices,
    learningDevice: learningDevices.join(", "),
    preferredSession: formData.get("preferredSession"),
    attendanceCommitment: formData.get("attendanceCommitment"),
    paymentReadiness: formData.get("paymentReadiness"),
    courseFee: pricing.courseFee,
    courseCount: pricing.courseCount,
    pricingBreakdown: pricing.breakdown,
    expectations: formData.get("expectations")?.trim(),
    agreements: getCheckedValues(formData, "agreements"),
    website: formData.get("website")?.trim(),
    pageUrl: window.location.href
  };
}

function validateForm(payload) {
  if (payload.interests.length === 0) {
    return "Select at least one topic you want to learn.";
  }

  if (payload.learningDevices.length === 0) {
    return "Select at least one learning device.";
  }

  if (!payload.courseFee || payload.courseFee < 10000) {
    return "Select your course interests so the correct training fee can be calculated.";
  }

  if (payload.agreements.length < 4) {
    return "Please accept all agreement items before submitting.";
  }

  if (payload.paymentReadiness === paidProofValue && screenshotInput.files.length === 0) {
    return "Upload your payment screenshot before submitting.";
  }

  return "";
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

async function preparePaymentScreenshot() {
  const file = screenshotInput.files[0];

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

interestInputs.forEach((input) => {
  input.addEventListener("change", updatePricing);
});

paymentRadios.forEach((radio) => {
  radio.addEventListener("change", updateScreenshotRequirement);
});

previousButton.addEventListener("click", () => {
  setStep(currentStep - 1);
});

nextButton.addEventListener("click", () => {
  if (validateStep(currentStep)) {
    setStep(currentStep + 1);
  }
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  updatePricing();
  updateScreenshotRequirement();

  for (let index = 0; index < formSteps.length; index += 1) {
    setStep(index);

    if (!validateStep(index)) {
      return;
    }
  }

  setAllStepControlsDisabled(false);
  const payload = buildPayload(form);
  const validationError = validateForm(payload);

  if (validationError) {
    setStep(formSteps.length - 1);
    setStatus("error", validationError);
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "Submitting...";
  setStatus("success", "Preparing your registration...");

  try {
    payload.paymentScreenshot = await preparePaymentScreenshot();
    setStatus("success", "Sending your registration...");

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

    form.reset();
    updatePricing();
    setStep(0);
    setStatus(
      "success",
      `Congratulations! Your registration has been received. Your Student ID is ${result.studentId || "being generated"}. We will contact you via WhatsApp or email with the next steps.`
    );
  } catch (error) {
    setStep(formSteps.length - 1);
    setStatus(
      "error",
      error.message || "Something went wrong. Please try again or contact the academy on WhatsApp."
    );
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Submit Registration";
  }
});

updatePricing();
updateScreenshotRequirement();
setStep(0);

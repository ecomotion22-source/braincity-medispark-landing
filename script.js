const revealElements = document.querySelectorAll(".reveal");
const form = document.querySelector("#lead-form");
const statusText = document.querySelector("#form-status");
const callForm = document.querySelector("#call-form");
const callStatusText = document.querySelector("#call-form-status");
const callModal = document.querySelector("#call-modal");
const callTriggers = document.querySelectorAll(".js-call-trigger");
const callNumber = "01066892348";

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.18 }
);

revealElements.forEach((element) => revealObserver.observe(element));

function formatPhone(value) {
  const digits = value.replace(/\D/g, "").slice(0, 11);

  if (digits.length < 4) return digits;
  if (digits.length < 8) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

function setStatus(message, type = "") {
  statusText.textContent = message;
  statusText.classList.remove("is-error", "is-success");
  if (type) {
    statusText.classList.add(type);
  }
}

function setCallStatus(message, type = "") {
  callStatusText.textContent = message;
  callStatusText.classList.remove("is-error", "is-success");
  if (type) {
    callStatusText.classList.add(type);
  }
}

function openCallModal() {
  callModal.classList.add("is-open");
  callModal.setAttribute("aria-hidden", "false");

  const nameValue = form?.querySelector('input[name="name"]')?.value?.trim() || "";
  const phoneValue = form?.querySelector('input[name="phone"]')?.value?.trim() || "";
  const messageValue = form?.querySelector('textarea[name="message"]')?.value?.trim() || "";

  const callName = callForm?.querySelector('input[name="name"]');
  const callPhone = callForm?.querySelector('input[name="phone"]');
  const callMessage = callForm?.querySelector('textarea[name="message"]');

  if (callName && !callName.value && nameValue) callName.value = nameValue;
  if (callPhone && !callPhone.value && phoneValue) callPhone.value = phoneValue;
  if (callMessage && !callMessage.value && messageValue) callMessage.value = messageValue;

  callName?.focus();
  document.body.style.overflow = "hidden";
}

function closeCallModal() {
  callModal.classList.remove("is-open");
  callModal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

document.querySelectorAll('input[type="tel"]').forEach((input) => {
  input.addEventListener("input", (event) => {
    event.target.value = formatPhone(event.target.value);
  });
});

callTriggers.forEach((trigger) => {
  trigger.addEventListener("click", openCallModal);
});

callModal?.querySelectorAll("[data-modal-close]").forEach((button) => {
  button.addEventListener("click", closeCallModal);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && callModal?.classList.contains("is-open")) {
    closeCallModal();
  }
});

async function submitLead(payload) {
  const response = await fetch("/api/lead", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok || result.ok === false) {
    const error = new Error(result.error || "submit_failed");
    error.result = result;
    throw error;
  }

  return result;
}

function validateLeadPayload(payload, options = {}) {
  const { requireInterest = true } = options;

  if (payload.website) {
    throw new Error("정상적인 요청이 아닙니다.");
  }

  if (!payload.name?.trim()) {
    throw new Error("이름을 입력해 주세요.");
  }

  if (!/^01[0-9]-\d{3,4}-\d{4}$/.test(payload.phone || "")) {
    throw new Error("휴대폰번호를 정확히 입력해 주세요.");
  }

  if (requireInterest && (!payload.interestType || !payload.consultingType)) {
    throw new Error("관심 평형과 상담 희망을 선택해 주세요.");
  }

  if (!payload.privacy) {
    throw new Error("개인정보 수집 동의가 필요합니다.");
  }
}

form?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());
  const submitButton = form.querySelector(".submit-button");

  payload.privacy = form.querySelector('input[name="privacy"]').checked;
  payload.leadSource = "메인문의폼";

  try {
    validateLeadPayload(payload);
  } catch (error) {
    setStatus(error.message, "is-error");
    return;
  }

  payload.createdAt = new Date().toISOString();

  submitButton.disabled = true;
  submitButton.textContent = "등록 중...";
  setStatus("관심고객 등록을 처리하고 있습니다.");

  try {
    await submitLead(payload);

    form.reset();
    setStatus("등록이 완료되었습니다. 순차적으로 상담 안내를 드리겠습니다.", "is-success");
  } catch (error) {
    setStatus(
      "등록 중 문제가 발생했습니다. 잠시 후 다시 시도하시거나 010-6689-2348로 문의해 주세요.",
      "is-error"
    );
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "관심고객 등록하기";
  }
});

callForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(callForm);
  const payload = Object.fromEntries(formData.entries());
  const submitButton = callForm.querySelector(".submit-button");

  payload.privacy = callForm.querySelector('input[name="privacy"]').checked;
  payload.createdAt = new Date().toISOString();
  payload.triggerCall = true;

  try {
    validateLeadPayload(payload, { requireInterest: false });
  } catch (error) {
    setCallStatus(error.message, "is-error");
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "등록 중...";
  setCallStatus("전화상담 연결을 준비하고 있습니다.");

  try {
    await submitLead(payload);

    setCallStatus("등록이 완료되었습니다. 전화 연결을 진행합니다.", "is-success");

    const mainNameField = form?.querySelector('input[name="name"]');
    const mainPhoneField = form?.querySelector('input[name="phone"]');
    if (mainNameField) mainNameField.value = payload.name;
    if (mainPhoneField) mainPhoneField.value = payload.phone;

    setTimeout(() => {
      window.location.href = `tel:${callNumber}`;
    }, 250);

    setTimeout(() => {
      callForm.reset();
      closeCallModal();
      setCallStatus("등록 후 바로 전화 연결을 시도합니다. 통신 환경에 따라 전화 앱이 열릴 수 있습니다.");
    }, 900);
  } catch (error) {
    setCallStatus(
      "전화상담 등록 중 문제가 발생했습니다. 잠시 후 다시 시도하시거나 010-6689-2348로 직접 전화해 주세요.",
      "is-error"
    );
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "정보 남기고 전화 연결하기";
  }
});

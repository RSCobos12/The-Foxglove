const forgotPasswordForm = document.querySelector(
  "#forgot-password-form"
);

const emailInput = document.querySelector(
  "#recovery-email"
);

const message = document.querySelector(
  "#forgot-password-message"
);

function showMessage(text, isError = false) {
  message.hidden = false;
  message.textContent = text;
  message.classList.toggle(
    "is-error",
    isError
  );
}

forgotPasswordForm?.addEventListener(
  "submit",
  async (event) => {
    event.preventDefault();

    message.hidden = true;

    const email =
      emailInput.value.trim();

    if (!email) {
      showMessage(
        "Please enter your email address.",
        true
      );
      return;
    }

    const { error } =
      await foxgloveSupabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo:
            "https://thefoxglove.us/pages/reset-password.html",
        }
      );

    if (error) {
      showMessage(
        error.message,
        true
      );
      return;
    }

    forgotPasswordForm.reset();

    showMessage(
      "If an account exists for that email address, a password recovery email has been sent."
    );
  }
);
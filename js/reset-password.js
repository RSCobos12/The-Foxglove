document.addEventListener(
  "DOMContentLoaded",
  async () => {
    const resetForm =
      document.querySelector(
        "#reset-password-form"
      );

    const loadingMessage =
      document.querySelector(
        "#reset-password-loading"
      );

    const statusMessage =
      document.querySelector(
        "#reset-password-message"
      );

    const passwordInput =
      document.querySelector(
        "#new-password"
      );

    const confirmationInput =
      document.querySelector(
        "#confirm-new-password"
      );

    const submitButton =
      document.querySelector(
        "#reset-password-submit"
      );

    if (
      !resetForm ||
      !loadingMessage ||
      !statusMessage ||
      !passwordInput ||
      !confirmationInput ||
      !submitButton
    ) {
      return;
    }

    const foxgloveSupabase =
      window.foxgloveSupabase;

    let recoverySessionReady = false;

    function showMessage(
      text,
      type = "error"
    ) {
      statusMessage.textContent = text;

      statusMessage.className =
        type === "success"
          ? "login-message is-success"
          : "login-message is-error";

      statusMessage.hidden = false;
    }

    function showRecoveryForm() {
      if (recoverySessionReady) {
        return;
      }

      recoverySessionReady = true;
      loadingMessage.hidden = true;
      resetForm.hidden = false;
      passwordInput.focus();
    }

    function showInvalidLink() {
      loadingMessage.textContent =
        "This recovery link is invalid or has expired.";

      loadingMessage.className =
        "login-message is-error";
    }

    const {
      data: authListener,
    } =
      foxgloveSupabase.auth
        .onAuthStateChange(
          (event, session) => {
            if (
              event === "PASSWORD_RECOVERY" &&
              session
            ) {
              showRecoveryForm();
            }
          }
        );

    const {
      data: { session },
      error: sessionError,
    } =
      await foxgloveSupabase.auth
        .getSession();

    if (!sessionError && session) {
      showRecoveryForm();
    } else {
      window.setTimeout(() => {
        if (!recoverySessionReady) {
          showInvalidLink();
        }
      }, 1500);
    }

    resetForm.addEventListener(
      "submit",
      async (event) => {
        event.preventDefault();

        statusMessage.hidden = true;

        const password =
          passwordInput.value;

        const confirmation =
          confirmationInput.value;

        if (password.length < 12) {
          showMessage(
            "Your password must be at least 12 characters."
          );

          passwordInput.focus();
          return;
        }

        if (password !== confirmation) {
          showMessage(
            "The passwords do not match."
          );

          confirmationInput.focus();
          return;
        }

        submitButton.disabled = true;
        submitButton.textContent =
          "Updating Password...";

        const {
          error: updateError,
        } =
          await foxgloveSupabase.auth
            .updateUser({
              password,
            });

        if (updateError) {
          showMessage(
            updateError.message ||
              "Unable to update your password."
          );

          submitButton.disabled = false;
          submitButton.textContent =
            "Update Password";

          return;
        }

        showMessage(
          "Your password has been updated. Redirecting you to sign in...",
          "success"
        );

        await foxgloveSupabase.auth.signOut();

        window.setTimeout(() => {
          window.location.replace(
            "login.html?password=updated"
          );
        }, 1000);
      }
    );

    window.addEventListener(
      "beforeunload",
      () => {
        authListener.subscription.unsubscribe();
      }
    );
  }
);
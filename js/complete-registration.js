document.addEventListener(
  "DOMContentLoaded",
  async () => {
    const registrationForm =
      document.querySelector(
        "#complete-registration-form"
      );

    if (!registrationForm) {
      return;
    }

    const loadingMessage =
      document.querySelector(
        "#registration-loading"
      );

    const statusMessage =
      document.querySelector(
        "#registration-message"
      );

    const passwordInput =
      document.querySelector(
        "#registration-password"
      );

    const passwordConfirmationInput =
      document.querySelector(
        "#registration-password-confirmation"
      );

    const submitButton =
      document.querySelector(
        "#complete-registration-submit"
      );

    function showMessage(
      message,
      type = "error"
    ) {
      statusMessage.textContent =
        message;

      statusMessage.className =
        type === "success"
          ? "login-message is-success"
          : "login-message is-error";

      statusMessage.hidden = false;
    }

    function hideLoadingMessage() {
      loadingMessage.hidden = true;
    }

    const {
      data: { session },
      error: sessionError,
    } =
      await foxgloveSupabase.auth
        .getSession();

    hideLoadingMessage();

    if (
      sessionError ||
      !session
    ) {
      showMessage(
        "This invitation link is invalid or has expired."
      );

      return;
    }

    const {
      data: profile,
      error: profileError,
    } =
      await foxgloveSupabase
        .from("profiles")
        .select(
          "role, account_status, is_active"
        )
        .eq(
          "id",
          session.user.id
        )
        .single();

    if (
      profileError ||
      !profile
    ) {
      showMessage(
        "Your member profile could not be found."
      );

      return;
    }

    if (
      profile.account_status ===
        "active" &&
      profile.is_active
    ) {
      await foxgloveSupabase.auth
        .signOut();

      window.location.replace(
        "login.html?registration=complete"
      );

      return;
    }

    registrationForm.hidden = false;

    passwordInput.focus();

    registrationForm.addEventListener(
      "submit",
      async (event) => {
        event.preventDefault();

        statusMessage.hidden = true;

        const password =
          passwordInput.value;

        const passwordConfirmation =
          passwordConfirmationInput.value;

        if (
          password !==
          passwordConfirmation
        ) {
          showMessage(
            "The passwords do not match."
          );

          passwordConfirmationInput.focus();

          return;
        }

        if (
          password.length < 12
        ) {
          showMessage(
            "Your password must be at least 12 characters."
          );

          passwordInput.focus();

          return;
        }

        submitButton.disabled = true;

        submitButton.textContent =
          "Activating Account...";

        const {
          error: passwordError,
        } =
          await foxgloveSupabase.auth
            .updateUser({
              password,
            });

        if (passwordError) {
          showMessage(
            passwordError.message ||
              "Unable to create your password."
          );

          submitButton.disabled = false;

          submitButton.textContent =
            "Activate Account";

          return;
        }

        const {
          data: activationData,
          error: activationError,
        } =
          await foxgloveSupabase.rpc(
            "activate_invited_profile"
          );

        if (
          activationError ||
          !activationData?.is_active
        ) {
          showMessage(
            "Your password was created, but your account could not be activated. Please contact an administrator."
          );

          submitButton.disabled = false;

          submitButton.textContent =
            "Activate Account";

          return;
        }

        showMessage(
          "Registration complete. Redirecting you to sign in...",
          "success"
        );

        await foxgloveSupabase.auth
          .signOut();

        window.setTimeout(
          () => {
            window.location.replace(
              "login.html?registration=complete"
            );
          },
          900
        );
      }
    );
  }
);
const SUPABASE_URL = "https://oxtpukpghvsfgsxpyqri.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_rTCxc-eEx7qi45mB93j19w_eQ7Lv1UI";

const foxgloveSupabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

window.foxgloveSupabase = foxgloveSupabase;

const loginForm = document.querySelector("#login-form");
const loginMessage = document.querySelector("#login-message");
const loginSubmit = document.querySelector(".login-submit");

function showLoginMessage(message, type = "error") {
  loginMessage.textContent = message;
  loginMessage.classList.remove("is-error", "is-success");
  loginMessage.classList.add(
    type === "success" ? "is-success" : "is-error"
  );
  loginMessage.hidden = false;
}

function clearLoginMessage() {
  loginMessage.textContent = "";
  loginMessage.classList.remove("is-error", "is-success");
  loginMessage.hidden = true;
}

if (loginForm) {

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearLoginMessage();

  const formData = new FormData(loginForm);
  const email = formData.get("email").trim();
  const password = formData.get("password");

  loginSubmit.disabled = true;
  loginSubmit.textContent = "Signing In...";

  const { data, error } =
    await foxgloveSupabase.auth.signInWithPassword({
      email,
      password,
    });

  if (error) {
    showLoginMessage(
      "Unable to sign in. Check your email and password."
    );

    loginSubmit.disabled = false;
    loginSubmit.textContent = "Sign In";
    return;
  }

 const { data: profile, error: profileError } =
  await foxgloveSupabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", data.user.id)
    .single();

if (
  profileError ||
  !profile ||
  !profile.is_active
) {
  await foxgloveSupabase.auth.signOut();

  showLoginMessage(
    "Your account is not currently available."
  );

  loginSubmit.disabled = false;
  loginSubmit.textContent = "Sign In";
  return;
}

showLoginMessage("Sign-in successful.", "success");

if (profile.role === "admin") {
  window.location.href = "admin.html";
} else {
  window.location.href = "member-lounge.html";
}

});

}

// -----------------------------
// Administrator Signup
// -----------------------------

const adminSignupForm = document.querySelector("#admin-signup-form");

if (adminSignupForm) {

  const signupMessage = document.querySelector("#signup-message");

  adminSignupForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    signupMessage.hidden = true;

    const firstName = document.querySelector("#first-name").value.trim();
    const lastName = document.querySelector("#last-name").value.trim();
    const email = document.querySelector("#signup-email").value.trim();
    const password = document.querySelector("#signup-password").value;

    const { data, error } = await foxgloveSupabase.auth.signUp({

      email,
      password,

      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          role: "admin"
        }
      }

    });

    if (error) {

      signupMessage.hidden = false;
      signupMessage.className = "login-message is-error";
      signupMessage.textContent = error.message;

      return;

    }

    signupMessage.hidden = false;
    signupMessage.className = "login-message is-success";
    signupMessage.textContent =
      "Administrator account created. Check your email to verify your account.";

    adminSignupForm.reset();

    console.log(data);

  });

}
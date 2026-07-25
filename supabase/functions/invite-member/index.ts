import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "jsr:@supabase/server@^1";

import {
  createClient,
} from "npm:@supabase/supabase-js@2";

const supabaseUrl =
  Deno.env.get("SUPABASE_URL");

const secretKeysJson =
  Deno.env.get(
    "SUPABASE_SECRET_KEYS"
  );

if (
  !supabaseUrl ||
  !secretKeysJson
) {
  throw new Error(
    "Supabase server credentials are unavailable."
  );
}

const secretKeys =
  JSON.parse(secretKeysJson);

const supabaseAdmin =
  createClient(
    supabaseUrl,
    secretKeys.default,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    }
  );

interface InviteMemberPayload {
  firstName?: unknown;
  lastName?: unknown;
  email?: unknown;
  role?: unknown;
}

function normalizeText(value: unknown): string {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email
  );
}

export default {
  fetch: withSupabase(
    { auth: "user" },
    async (req, ctx) => {
      if (req.method !== "POST") {
        return Response.json(
          {
            error:
              "Method not allowed.",
          },
          {
            status: 405,
          }
        );
      }

      const {
        data: isAdmin,
        error: adminCheckError,
      } = await ctx.supabase.rpc(
        "is_admin"
      );

      if (adminCheckError) {
        console.error(
          "Administrator check failed:",
          adminCheckError
        );

        return Response.json(
          {
            error:
              "Unable to verify administrator access.",
          },
          {
            status: 500,
          }
        );
      }

      if (!isAdmin) {
        return Response.json(
          {
            error:
              "Administrator access is required.",
          },
          {
            status: 403,
          }
        );
      }

      let payload: InviteMemberPayload;

      try {
        payload =
          await req.json();
      } catch {
        return Response.json(
          {
            error:
              "A valid JSON request body is required.",
          },
          {
            status: 400,
          }
        );
      }

      const firstName =
        normalizeText(
          payload.firstName
        );

      const lastName =
        normalizeText(
          payload.lastName
        );

      const email =
        normalizeText(
          payload.email
        ).toLowerCase();

      const role =
        normalizeText(
          payload.role
        );

      if (!firstName) {
        return Response.json(
          {
            error:
              "First name is required.",
          },
          {
            status: 400,
          }
        );
      }

      if (!lastName) {
        return Response.json(
          {
            error:
              "Last name is required.",
          },
          {
            status: 400,
          }
        );
      }

      if (
        !email ||
        !isValidEmail(email)
      ) {
        return Response.json(
          {
            error:
              "A valid email address is required.",
          },
          {
            status: 400,
          }
        );
      }

      if (
        role !== "member" &&
        role !== "admin"
      ) {
        return Response.json(
          {
            error:
              "Role must be member or admin.",
          },
          {
            status: 400,
          }
        );
      }

      const {
  data: invitationData,
  error: invitationError,
} = await supabaseAdmin.auth.admin
  .inviteUserByEmail(
  email,
  {
    redirectTo:
      "https://thefoxglove.us/pages/complete-registration.html",

    data: {
      first_name:
        firstName,

      last_name:
        lastName,

      role,

      account_status:
        "invited",

      is_active:
        false,
    },
  }
);

if (invitationError) {
  console.error(
    "Member invitation failed:",
    invitationError
  );

  if (
    invitationError.code ===
    "over_email_send_rate_limit"
  ) {
    return Response.json(
      {
        error:
          "The invitation email limit has been reached. Please try again later.",
      },
      {
        status: 429,
      }
    );
  }

  const duplicateAccount =
    invitationError.message
      .toLowerCase()
      .includes("already");

  return Response.json(
    {
      error: duplicateAccount
        ? "An account already exists for this email address."
        : "Unable to send the member invitation.",
    },
    {
      status: duplicateAccount
        ? 409
        : 500,
    }
  );
}

return Response.json(
  {
    success: true,
    message:
      "Member invitation sent successfully.",
    member: {
      id:
        invitationData.user?.id ??
        null,
      firstName,
      lastName,
      email,
      role,
      accountStatus:
        "invited",
    },
  },
  {
    status: 200,
  }
);
    }
  ),
};
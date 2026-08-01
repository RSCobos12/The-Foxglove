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

interface DeleteMemberPayload {
  profileId?: unknown;
}

function normalizeText(
  value: unknown
): string {
  return typeof value === "string"
    ? value.trim()
    : "";
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

      const {
        data: currentUserData,
        error: currentUserError,
      } =
        await ctx.supabase.auth.getUser();

      if (
        currentUserError ||
        !currentUserData.user
      ) {
        return Response.json(
          {
            error:
              "Unable to identify the current administrator.",
          },
          {
            status: 401,
          }
        );
      }

      let payload:
        DeleteMemberPayload;

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

      const profileId =
        normalizeText(
          payload.profileId
        );

      if (!profileId) {
        return Response.json(
          {
            error:
              "A member profile ID is required.",
          },
          {
            status: 400,
          }
        );
      }

      if (
        profileId ===
        currentUserData.user.id
      ) {
        return Response.json(
          {
            error:
              "You cannot delete your own administrator account.",
          },
          {
            status: 400,
          }
        );
      }

      const {
        data: targetProfile,
        error: targetProfileError,
      } = await supabaseAdmin
        .from("profiles")
        .select(
          "id, first_name, last_name, email"
        )
        .eq("id", profileId)
        .maybeSingle();

      if (targetProfileError) {
        console.error(
          "Unable to load member profile:",
          targetProfileError
        );

        return Response.json(
          {
            error:
              "Unable to verify the selected member.",
          },
          {
            status: 500,
          }
        );
      }

      if (!targetProfile) {
        return Response.json(
          {
            error:
              "The selected member no longer exists.",
          },
          {
            status: 404,
          }
        );
      }

      const {
        error: rsvpCleanupError,
      } = await supabaseAdmin
        .from("rsvps")
        .update({
          profile_id: null,
          member_id: null,
        })
        .or(
          `profile_id.eq.${profileId},member_id.eq.${profileId}`
        );

      if (rsvpCleanupError) {
        console.error(
          "RSVP relationship cleanup failed:",
          rsvpCleanupError
        );

        return Response.json(
          {
            error:
              "Unable to prepare the member account for deletion.",
          },
          {
            status: 500,
          }
        );
      }

      const {
        error: authDeleteError,
      } =
        await supabaseAdmin.auth.admin
          .deleteUser(profileId);

      if (authDeleteError) {
        console.error(
          "Auth user deletion failed:",
          authDeleteError
        );

        return Response.json(
          {
            error:
              "Unable to delete the member login account.",
          },
          {
            status: 500,
          }
        );
      }

      const {
        error: profileDeleteError,
      } = await supabaseAdmin
        .from("profiles")
        .delete()
        .eq("id", profileId);

      if (profileDeleteError) {
        console.error(
          "Profile deletion failed:",
          profileDeleteError
        );

        return Response.json(
          {
            error:
              "The login account was deleted, but the profile record could not be removed.",
          },
          {
            status: 500,
          }
        );
      }

      const fullName =
        [
          targetProfile.first_name,
          targetProfile.last_name,
        ]
          .filter(Boolean)
          .join(" ")
          .trim() ||
        targetProfile.email ||
        "Member";

      return Response.json(
        {
          success: true,
          message:
            `${fullName} was permanently deleted.`,
          deletedMember: {
            id:
              targetProfile.id,
            name:
              fullName,
          },
        },
        {
          status: 200,
        }
      );
    }
  ),
};
export default {
  async fetch(request, env) {

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "*"
    };

    // preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // test route
    if (request.method === "GET") {
      return new Response("Fanora Upload API Running 🔥", {
        headers: corsHeaders
      });
    }

    // upload route
    if (request.method === "POST") {

      try {

        const formData = await request.formData();
        const file = formData.get("file");

        if (!file) {
          return Response.json({
            success: false,
            error: "No file uploaded"
          }, { headers: corsHeaders });
        }

        // 🔥 1GB LIMIT (browser + worker safe check)
        const MAX_SIZE = 1024 * 1024 * 1024; // 1GB

        if (file.size > MAX_SIZE) {
          return Response.json({
            success: false,
            error: "File too large. Max 1GB allowed"
          }, { headers: corsHeaders });
        }

        // unique file name
        const key =
          Date.now() + "-" + file.name;

        // upload to R2
        await env.BUCKET.put(
          key,
          file.stream(),
          {
            httpMetadata: {
              contentType: file.type
            }
          }
        );

        // public URL
        const url =
          `https://pub-68cc7b51e08ea9e455f884241b3eff12.r2.dev/${key}`;

        return Response.json({
          success: true,
          fileName: key,
          type: file.type,
          size: file.size,
          url: url
        }, { headers: corsHeaders });

      } catch (err) {

        return Response.json({
          success: false,
          error: err.message
        }, { headers: corsHeaders });
      }
    }

    return new Response("Method Not Allowed", {
      headers: corsHeaders
    });
  }
};

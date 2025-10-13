import Ajv from "ajv";
import addFormats from "ajv-formats";
import fetch from "node-fetch";
import fs from "fs";

const ajv = new Ajv({ strict: false });
addFormats(ajv);

const schemaUrl = "https://static.modelcontextprotocol.io/schemas/2025-09-29/server.schema.json";

async function validate() {
  try {
    const schemaResponse = await fetch(schemaUrl);
    if (!schemaResponse.ok) {
      console.error(`Failed to fetch schema: ${schemaResponse.statusText}`);
      process.exit(1);
    }
    const schema = await schemaResponse.json();

    const serverConfig = JSON.parse(fs.readFileSync("server.json", "utf-8"));

    const validate = ajv.compile(schema);
    const valid = validate(serverConfig);

    if (valid) {
      console.log("server.json is valid!");
    } else {
      console.error("server.json is invalid:");
      console.error(validate.errors);
      process.exit(1);
    }
  } catch (error) {
    console.error("An error occurred during validation:", error);
    process.exit(1);
  }
}

validate();

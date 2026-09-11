export type ToolSchema = {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: Record<string, unknown>;
      required: string[];
      additionalProperties: false;
    };
  };
};

function tool(name: string, description: string, properties: Record<string, unknown>, required: string[] = []): ToolSchema {
  return {
    type: "function",
    function: {
      name,
      description,
      parameters: { type: "object", properties, required, additionalProperties: false },
    },
  };
}

const stringProp = { type: "string" };

/** Schemas for CAP-001 tools. The provider refuses an allowed tool that has no schema. */
export const CAP001_TOOL_SCHEMAS: ToolSchema[] = [
  tool("search_contact", "Find contacts by exact email or name. Returns at most 8 matches.", { query: stringProp }, ["query"]),
  tool("get_contact", "Read one contact by exact email.", { email: stringProp }, ["email"]),
  tool("create_task", "Create an open follow-up task.", {
    contactEmail: stringProp,
    title: stringProp,
    due: { type: "string", description: "YYYY-MM-DD" },
  }, ["title"]),
  tool("get_deal", "Read the deal for a contact email, or null.", { contactEmail: stringProp }, ["contactEmail"]),
  tool("update_deal", "Change the stage of an existing deal. Does not create a deal.", {
    contactEmail: stringProp,
    stage: stringProp,
  }, ["contactEmail", "stage"]),
  tool("add_note", "Add a CRM note. This does not send a message.", { contactEmail: stringProp, body: stringProp }, ["contactEmail", "body"]),
  tool("draft_reply", "Save a draft. This does not send email.", { to: stringProp, body: stringProp }, ["to", "body"]),
  tool("send_reply", "Send a message. This is the only way to email someone.", { to: stringProp, body: stringProp }, ["to", "body"]),
  tool("get_policy", "Read a company policy by topic, such as pricing.", { topic: stringProp }, ["topic"]),
  tool("get_availability", "Check whether an exact ISO start time is free.", { start: stringProp }, ["start"]),
  tool("create_appointment", "Book a free slot for a contact.", {
    contactEmail: stringProp,
    title: stringProp,
    start: stringProp,
    end: stringProp,
  }, ["contactEmail", "start"]),
  tool("escalate", "Hand the case to a person. Use this instead of guessing.", { reason: stringProp }, ["reason"]),
  tool("flag", "Record a machine-readable flag. This does not send a message.", { code: stringProp, message: stringProp }, ["code", "message"]),
];

const byName = new Map(CAP001_TOOL_SCHEMAS.map((schema) => [schema.function.name, schema]));

export function schemasForAllowedTools(allowedTools: string[]): ToolSchema[] {
  const missing = allowedTools.filter((name) => !byName.has(name));
  if (missing.length > 0) {
    throw new Error(`No tool schema for: ${missing.join(", ")}. Refusing to hide an allowed tool from the model.`);
  }
  return allowedTools.map((name) => {
    const schema = byName.get(name);
    if (!schema) throw new Error(`No tool schema for ${name}`);
    return schema;
  });
}

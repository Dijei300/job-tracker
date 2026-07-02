export async function extractSkills(description: string): Promise<string[]> {
  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content: `You are a skill extraction assistant. 
When given a job description, extract all technical skills, 
technologies, programming languages, frameworks, tools, and 
professional competencies mentioned. 
Return ONLY a valid JSON array of strings, nothing else. 
No explanation, no markdown, no code blocks. 
Example output: ["React", "TypeScript", "Node.js", "PostgreSQL"]`,
        },
        {
          role: "user",
          content: description,
        },
      ],
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    throw new Error(`DeepSeek API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content.trim();

  try {
    const skills = JSON.parse(content);
    if (!Array.isArray(skills)) return [];
    return skills.filter((s) => typeof s === "string" && s.length > 0);
  } catch {
    console.error("Failed to parse skills JSON:", content);
    return [];
  }
}

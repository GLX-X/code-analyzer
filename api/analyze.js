export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false });
  }

  const { code, language } = req.body;

  return res.status(200).json({
    success: true,
    analysis: {
      errors: [],
      warnings: [],
      suggestions: [
        "API working ✅",
        `Language: ${language}`,
        `Code length: ${code.length}`
      ],
      codeQuality: {
        score: 90,
        issues: []
      }
    }
  });
}

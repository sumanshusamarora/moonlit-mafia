export const generateGameCode = (): string => {
  const charset = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i += 1) {
    code += charset[Math.floor(Math.random() * charset.length)];
  }
  return code;
};

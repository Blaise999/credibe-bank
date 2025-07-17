module.exports = function generateIBAN(countryCode = "BE") {
  const randomPart = Math.floor(1000000000000000 + Math.random() * 9000000000000000);
  return `${countryCode}${randomPart}`.slice(0, 18);
};

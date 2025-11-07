
const { greet } = require("../src/greet");

test("greet function returns correct message", () => {
  expect(greet("Javier")).toBe("Hola, Javier!");
});


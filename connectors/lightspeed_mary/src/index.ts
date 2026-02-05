// connectors/lightspeed/src/index.ts
// Export all the components for Lightspeed POS
// export { LightspeedClient } from './client';
// export { LightspeedSync } from './sync';
// export { Database } from './database';
// export { LightspeedMapper } from './mapper';
// export * from './models';

import { LightspeedClient } from "./client";

async function main() {
  // testing mock api with local host 4020, “Test with mock API: http://localhost:4020”
  // part 1 of intern_guide
  const client = new LightspeedClient(
    "http://localhost:4020",
    "test"
  );

  try {
    const sales = await client.fetchSales();
    console.log("Sales:", sales);
  } catch (err) {
    console.error("Error:", err);
  }
}

main();
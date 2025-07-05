import { Effect, Layer, Context } from 'effect';

// Define a simple service
interface CounterService {
  increment: () => Effect.Effect<never, never, number>;
  getCount: () => Effect.Effect<never, never, number>;
}

// Create a Tag for the service
class CounterServiceLive extends Context.Tag('CounterService')<
  CounterServiceLive,
  CounterService
>() {}

// Implement the service
class CounterServiceImpl implements CounterService {
  private count = 0;

  increment(): Effect.Effect<never, never, number> {
    return Effect.sync(() => ++this.count);
  }

  getCount(): Effect.Effect<never, never, number> {
    return Effect.sync(() => this.count);
  }
}

// Create a Layer for the service
const CounterLayer = Layer.succeed(
  CounterServiceLive,
  new CounterServiceImpl()
);

// Create a program that uses the service
const program = Effect.gen(function* (_) {
  const counter = yield* _(CounterServiceLive);
  yield* _(counter.increment());
  yield* _(counter.increment());
  const count = yield* _(counter.getCount());
  console.log(`Count: ${count}`);
  return count;
});

// Run the program with the layer
const runProgram = () => {
  console.log('Starting program...');
  
  // This is what we're testing - how to provide a layer to a program
  const result = Effect.runSync(Layer.launch(CounterLayer).pipe(
    Effect.flatMap(() => program)
  ));
  
  console.log(`Result: ${result}`);
};

runProgram();
import { Effect } from 'effect';

// A simple example of using Effect for error handling
export const fetchUserData = (userId: string): Effect.Effect<any, Error, any> => {
  return Effect.try({
    try: () => {
      // Simulating a database call
      if (userId === 'invalid') {
        throw new Error('User not found');
      }
      return { id: userId, name: 'John Doe', email: 'john@example.com' };
    },
    catch: (error) => new Error(`Failed to fetch user: ${error}`)
  });
};

// Example of using Effect for asynchronous operations
export const fetchUserDataAsync = (userId: string): Effect.Effect<any, Error, any> => {
  return Effect.tryPromise({
    try: async () => {
      // Simulating an async database call
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          if (userId === 'invalid') {
            reject(new Error('User not found'));
          } else {
            resolve({ id: userId, name: 'John Doe', email: 'john@example.com' });
          }
        }, 100);
      });
    },
    catch: (error) => new Error(`Failed to fetch user: ${error}`)
  });
};

// Example of chaining operations
export const getUserAndUpdateProfile = (userId: string, profileData: any): Effect.Effect<any, Error, any> => {
  return fetchUserDataAsync(userId).pipe(
    Effect.flatMap(user => 
      Effect.try({
        try: () => {
          // Simulating profile update
          return { ...user, ...profileData, updated: true };
        },
        catch: (error) => new Error(`Failed to update profile: ${error}`)
      })
    )
  );
};

// Example usage
const runExample = () => {
  // Sync example
  const syncResult = Effect.runSync(fetchUserData('123'));
  console.log('Sync result:', syncResult);
  
  // Async example
  Effect.runPromise(fetchUserDataAsync('123'))
    .then(result => console.log('Async result:', result))
    .catch(error => console.error('Async error:', error));
  
  // Chained operations
  Effect.runPromise(getUserAndUpdateProfile('123', { age: 30 }))
    .then(result => console.log('Chained result:', result))
    .catch(error => console.error('Chained error:', error));
};

// Uncomment to run the example
// runExample();
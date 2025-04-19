export default function HomePage() {
  return (
    <div className="bg-background text-foreground flex h-screen flex-col items-center bg-gradient-to-b from-[#0e0b16] via-[#4c0033] to-[#1a1a40] text-center font-serif">
      <h1 className="mt-10 mb-6 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 bg-clip-text text-5xl font-bold text-transparent md:mt-11 md:mb-7 lg:mt-12 lg:mb-8">
        Battle 💪 Up
      </h1>
      <p className="mb-5 w-8/9 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 bg-clip-text text-xl font-light text-transparent md:mb-6 lg:mb-7">
        Challenge people in a real-time push-up battle. Compete, sweat, and win!
      </p>
      <button className="text-background cursor-fist mb-6 rounded-xl bg-gradient-to-r from-red-700 via-orange-500 to-yellow-300 px-8 py-3 text-lg font-semibold shadow-lg transition-transform duration-300 hover:scale-105 hover:brightness-125 md:mb-8 lg:mb-10">
        Start Battle
      </button>
      <div className="bg-card/25 flex max-w-9/10 flex-col justify-center gap-2 rounded-xl border-2 border-black/50 p-3 shadow-lg md:gap-3 lg:gap-4">
        <h2 className="text-3xl font-bold">💡 How It Works</h2>
        <ol>
          <li className="p-1 md:p-2 lg:p-3">
            <h3 className="text-xl font-semibold md:text-2xl">
              1. Join the Arena
            </h3>
            <p className="text-muted text-md">
              Click Start Battle to enter a 1v1 real-time push-up competition.
            </p>
          </li>
          <li className="p-1 md:p-2 lg:p-3">
            <h3 className="text-xl font-semibold md:text-2xl">
              2. Get Counted
            </h3>
            <p className="text-muted text-md">
              Your webcam tracks your push-ups using smart AI. No cheating.
            </p>
          </li>
          <li className="p-1 md:p-2 lg:p-3">
            <h3 className="text-xl font-semibold md:text-2xl">
              3. Win & Climb
            </h3>
            <p className="text-muted text-md">
              Beat your opponent and claim your spot at the top.
            </p>
          </li>
        </ol>
      </div>
    </div>
  );
}

"use client";

type Instruction = {
  title: string;
  description: string;
};

type InstructionsBoardProps = {
  title: string;
  instructions: Instruction[];
  backgroundClass?: string;
};

export default function InstructionsBoard({
  title,
  instructions,
  backgroundClass,
}: InstructionsBoardProps) {
  return (
    <div
      className={`mt-4 flex max-w-9/10 flex-col justify-center gap-2 rounded-xl border-2 border-black/50 p-3 shadow-lg md:gap-3 lg:gap-4 ${backgroundClass}`}
    >
      <h2 className="lg:4xl text-2xl font-bold md:text-3xl">{title}</h2>
      <ol>
        {instructions.map((instruction, index) => (
          <li key={index} className="p-1 md:p-2">
            <h3 className="text-lg font-semibold md:text-xl lg:text-2xl">
              {instruction.title}
            </h3>
            <p className="text-md text-muted md:text-lg lg:text-xl">
              {instruction.description}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}

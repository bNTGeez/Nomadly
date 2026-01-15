import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

type UserSeed = {
  name: string;
  email: string;
  trip?: {
    title?: string | null;
    city?: string | null;
    startDate: Date;
    endDate: Date;
    pace: "relax" | "normal" | "max";
    dayStart: string;
    dayEnd: string;
    budget: "dollar" | "dollarDollar" | "dollarDollarDollar";
    mealPlan: "light" | "standard" | "food_focused";
    interests: Record<string, number>;
    cuisines: string[];
  };
};

const users: UserSeed[] = [
  {
    name: "Bob",
    email: "bob@prisma.io",
    trip: {
      title: "Trip to Tokyo",
      city: "Tokyo",
      startDate: new Date("2025-11-01"),
      endDate: new Date("2025-11-05"),
      pace: "normal",
      dayStart: "09:30",
      dayEnd: "20:30",
      budget: "dollarDollar",
      mealPlan: "standard",
      interests: { food: 0.7, museums: 0.3 },
      cuisines: ["ramen", "sushi"],
    },
  },
  { name: "Alice", email: "alice@prisma.io" },
  { name: "Charlie", email: "charlie@prisma.io" },
  { name: "David", email: "david@prisma.io" },
];

export async function main() {
  // Hash a default password for seed users
  const defaultPassword = await bcrypt.hash("password123", 12);

  for (const u of users) {
    const createdUser = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        name: u.name,
        email: u.email,
        password: defaultPassword, // Required field
        trips: u.trip
          ? {
              create: {
                title: u.trip.title ?? null,
                city: u.trip.city ?? null,
                startDate: u.trip.startDate,
                endDate: u.trip.endDate,
                pace: u.trip.pace,
                dayStart: u.trip.dayStart,
                dayEnd: u.trip.dayEnd,
                budget: u.trip.budget,
                mealPlan: u.trip.mealPlan,
                interests: u.trip.interests, // JSON field
                cuisines: u.trip.cuisines,
              },
            }
          : undefined,
      },
    });
    console.log(`Seeded user ${createdUser.email}`);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

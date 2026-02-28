import { PrismaClient, PlanType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

interface DemoUser {
    email: string;
    password: string;
    planType: PlanType;
}

const demoUsers: DemoUser[] = [
    {
        email: 'demo@mypostapp.com',
        password: 'demo1234',
        planType: 'FREE',
    },
    {
        email: 'pro@mypostapp.com',
        password: 'pro12345',
        planType: 'PRO',
    },
    {
        email: 'enterprise@mypostapp.com',
        password: 'enter1234',
        planType: 'ENTERPRISE',
    },
];

async function main() {
    console.log('🌱 Seeding demo users...\n');

    for (const user of demoUsers) {
        const passwordHash = await bcrypt.hash(user.password, 12);

        const created = await prisma.user.upsert({
            where: { email: user.email },
            update: { passwordHash, planType: user.planType },
            create: {
                email: user.email,
                passwordHash,
                planType: user.planType,
            },
        });

        console.log(`  ✅  ${user.email}  |  password: ${user.password}  |  plan: ${user.planType}  |  id: ${created.id}`);
    }

    console.log('\n🎉 Demo users seeded successfully!');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

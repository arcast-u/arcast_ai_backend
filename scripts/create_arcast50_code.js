import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function createArcast50DiscountCode() {
  try {
    console.log('Checking if ARCAST50 discount code already exists...');
    
    const existingCode = await prisma.discountCode.findUnique({
      where: { code: 'ARCAST50' }
    });
    
    if (existingCode) {
      console.log('ARCAST50 discount code already exists. Updating it instead...');
      
      await prisma.discountCode.update({
        where: { id: existingCode.id },
        data: {
          type: 'PERCENTAGE',
          value: 50,
          isActive: true,
          firstTimeOnly: true,
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        }
      });
      
      console.log('ARCAST50 discount code updated successfully!');
    } else {
      console.log('Creating new ARCAST50 discount code...');
      
      await prisma.discountCode.create({
        data: {
          code: 'ARCAST50',
          type: 'PERCENTAGE',
          value: 50,
          isActive: true,
          firstTimeOnly: true,
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
          usedCount: 0
        }
      });
      
      console.log('ARCAST50 discount code created successfully!');
    }
  } catch (error) {
    console.error('Error creating/updating discount code:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createArcast50DiscountCode(); 
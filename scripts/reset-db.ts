import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  await prisma.automationLog.deleteMany()
  await prisma.article.deleteMany()
  await prisma.page.deleteMany()
  await prisma.apiKey.deleteMany()
  await prisma.category.deleteMany()
  await prisma.setting.deleteMany()
  await prisma.adminUser.deleteMany()
  await prisma.installLock.deleteMany()
  console.log('All data deleted successfully')
}
main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1) })

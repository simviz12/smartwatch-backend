-- CreateTable
CREATE TABLE "AppHealth" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ok',
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppHealth_pkey" PRIMARY KEY ("id")
);

-- CreateEnum
CREATE TYPE "CallDirection" AS ENUM ('IN', 'OUT');

-- CreateEnum
CREATE TYPE "CallStatus" AS ENUM ('INCOMING', 'OUTGOING', 'ACCEPTED', 'COMPLETED', 'CANCELLED', 'MISSED', 'BUSY', 'NOT_AVAILABLE', 'TRANSFERRED');

-- CreateTable
CREATE TABLE "call_logs" (
    "id" TEXT NOT NULL,
    "callId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "diversion" TEXT,
    "direction" "CallDirection" NOT NULL DEFAULT 'IN',
    "status" "CallStatus" NOT NULL DEFAULT 'INCOMING',
    "userId" TEXT,
    "ext" TEXT,
    "groupRealName" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "answeredAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "duration" INTEGER NOT NULL DEFAULT 0,
    "recordingUrl" TEXT,
    "transcription" TEXT,
    "aiSummary" TEXT,
    "aiSentiment" TEXT,
    "rating" INTEGER,
    "ticketId" TEXT,
    "operatorId" TEXT,
    "secondCallId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "call_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "call_logs_callId_key" ON "call_logs"("callId");

-- CreateIndex
CREATE INDEX "call_logs_phone_idx" ON "call_logs"("phone");

-- CreateIndex
CREATE INDEX "call_logs_callId_idx" ON "call_logs"("callId");

-- CreateIndex
CREATE INDEX "call_logs_status_idx" ON "call_logs"("status");

-- CreateIndex
CREATE INDEX "call_logs_operatorId_idx" ON "call_logs"("operatorId");

-- AddForeignKey
ALTER TABLE "call_logs" ADD CONSTRAINT "call_logs_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "tickets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "call_logs" ADD CONSTRAINT "call_logs_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

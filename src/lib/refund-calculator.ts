/**
 * Refund Calculator for Rental System
 * 
 * Rental Payment Structure:
 * - Full price for days actually used (up to end date)
 * - 50% refund for unused days (only applies to early returns)
 * - Full security deposit always returned
 * - 2x penalty per day if not picked up by next day after end date
 */

export interface RefundBreakdown {
  totalRentalDays: number
  daysUsed: number
  daysRemaining: number
  
  // Rental charges breakdown
  dailyRate: number
  chargeForDaysUsed: number  // Full price for days used
  refundForUnusedDays: number // 50% of per-day rate for unused days
  
  // Security deposit
  securityDeposit: number
  depositToBeReturned: number
  
  // Total calculations
  totalEarnings: number  // What lender receives
  totalRefund: number    // What renter receives
  
  // Penalty (if applicable)
  penaltyDays?: number
  penaltyAmount?: number
}

export function calculateRefund(
  pricePerDay: number,
  deposit: number,
  startDate: Date,
  endDate: Date,
  returnDate?: Date // Leave empty for active bookings
): RefundBreakdown {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const today = returnDate ? new Date(returnDate) : new Date()
  
  // Calculate total rental days (inclusive of both start and end date)
  const totalDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
  
  // Calculate days used
  let daysUsed = totalDays
  let daysRemaining = 0
  let refundForUnused = 0
  let penalty = 0
  let penaltyDays = 0
  
  if (returnDate) {
    // If item is being returned before end date
    if (today < end) {
      daysUsed = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
      daysRemaining = totalDays - daysUsed
      // Renter gets 50% refund for unused days
      refundForUnused = daysRemaining * (pricePerDay * 0.5)
    }
    // If item is not picked up by next day after end date
    else if (today > end) {
      const daysPastDue = Math.floor((today.getTime() - end.getTime()) / (1000 * 60 * 60 * 24))
      if (daysPastDue > 1) {
        penaltyDays = daysPastDue - 1
        penalty = penaltyDays * (pricePerDay * 2)
      }
    }
  }
  
  const chargeForUsed = daysUsed * pricePerDay
  
  return {
    totalRentalDays: totalDays,
    daysUsed,
    daysRemaining,
    
    dailyRate: pricePerDay,
    chargeForDaysUsed: chargeForUsed,
    refundForUnusedDays: refundForUnused,
    
    securityDeposit: deposit,
    depositToBeReturned: deposit, // Always return full deposit
    
    totalEarnings: chargeForUsed + penalty, // Lender gets charged amount + penalty
    totalRefund: refundForUnused + deposit, // Renter gets unused day refund + full deposit
    
    penaltyDays: penaltyDays > 0 ? penaltyDays : undefined,
    penaltyAmount: penalty > 0 ? penalty : undefined,
  }
}

export function formatRefundBreakdown(breakdown: RefundBreakdown): string {
  let summary = `Total Rental Days: ${breakdown.totalRentalDays}\n`
  summary += `Days Used: ${breakdown.daysUsed}\n`
  summary += `Days Remaining: ${breakdown.daysRemaining}\n\n`
  
  summary += `Daily Rate: ₹${breakdown.dailyRate}\n`
  summary += `Charge for ${breakdown.daysUsed} day(s): ₹${breakdown.chargeForDaysUsed}\n`
  
  if (breakdown.daysRemaining > 0) {
    summary += `Refund for ${breakdown.daysRemaining} unused day(s) (50%): ₹${breakdown.refundForUnusedDays}\n`
  }
  
  summary += `Security Deposit (returned): ₹${breakdown.depositToBeReturned}\n\n`
  
  if (breakdown.penaltyAmount && breakdown.penaltyAmount > 0) {
    summary += `⚠️ Late Pickup Penalty (${breakdown.penaltyDays} day(s) × 2x rate): ₹${breakdown.penaltyAmount}\n\n`
  }
  
  summary += `Renter Receives: ₹${breakdown.totalRefund}\n`
  summary += `Lender Receives: ₹${breakdown.totalEarnings}`
  
  return summary
}

import { db } from '../config/database.js';
import { notificationsRepository } from '../repositories/notifications.repository.js';
import { mailerService } from './mailer.service.js';
import { welcomeEmailTemplate } from '../templates/welcome-email.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export const notificationService = {
  async notifyCrewAssignment(crewAssignment) {
    const order = await db('orders').where({ id: crewAssignment.order_id }).first();
    if (!order) return;
    await notificationsRepository.create({
      user_id: crewAssignment.crew_id,
      type: 'assignment',
      title: 'New event assigned',
      message: `New event assigned: ${order.event_name}`,
      related_order_id: order.id,
    });
  },

  async notifyDesignerAssignment(designWork) {
    const order = await db('orders').where({ id: designWork.order_id }).first();
    if (!order) return;
    await notificationsRepository.create({
      user_id: designWork.designer_id,
      type: 'assignment',
      title: 'New design work assigned',
      message: `New design work assigned: ${order.event_name}`,
      related_order_id: order.id,
    });
  },

  // Bug fix vs. the original PocketBase hook, which compared against the stale
  // enum value "Done" instead of the current "completed" and therefore never fired.
  async notifyDesignComplete(designWork) {
    if (designWork.status !== 'completed') return;
    const order = await db('orders').where({ id: designWork.order_id }).first();
    if (!order) return;

    const crewAssignments = await db('crew_assignments').where({ order_id: designWork.order_id });
    await Promise.all(crewAssignments.map((assignment) => notificationsRepository.create({
      user_id: assignment.crew_id,
      type: 'design_ready',
      title: 'Design files ready',
      message: `Design files ready for: ${order.event_name}`,
      related_order_id: order.id,
    })));
  },

  async notifyPaymentReceived(payment) {
    const invoice = await db('invoices').where({ id: payment.invoice_id }).first();
    if (!invoice) return;
    const order = await db('orders').where({ id: invoice.order_id }).first();
    if (!order) return;

    const crewAssignments = await db('crew_assignments').where({ order_id: order.id });
    await Promise.all(crewAssignments.map((assignment) => notificationsRepository.create({
      user_id: assignment.crew_id,
      type: 'payment_received',
      title: 'Payment received',
      message: `Payment received: ${payment.amount} IDR`,
      related_order_id: order.id,
    })));
  },

  async sendWelcomeEmail(user) {
    if (!['designer', 'crew'].includes(user.role)) return;
    const { subject, html, text } = welcomeEmailTemplate({
      name: user.name,
      loginUrl: `${env.frontendUrl}/login`,
    });
    try {
      await mailerService.send({ to: user.email, subject, html, text });
    } catch (err) {
      logger.error({ err, userId: user.id }, 'welcome_email_send_failed');
    }
  },
};

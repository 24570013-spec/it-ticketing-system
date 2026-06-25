import { useNavigate } from 'react-router-dom';
import StatusBadge from './StatusBadge';

export default function TicketCard({ ticket }) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/tickets/${ticket.id}`)}
      style={{
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '12px',
        cursor: 'pointer',
        background: '#fff',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '1rem' }}>{ticket.title}</h3>
        <StatusBadge status={ticket.status} />
      </div>
      <div style={{ marginTop: '8px', fontSize: '0.85rem', color: '#6b7280' }}>
        Priority: <strong>{ticket.priority}</strong> &nbsp;|&nbsp;
        {new Date(ticket.created_at).toLocaleDateString()}
        {ticket.assigned_to_name && <span> &nbsp;|&nbsp; Assigned: <strong>{ticket.assigned_to_name}</strong></span>}
      </div>
    </div>
  );
}

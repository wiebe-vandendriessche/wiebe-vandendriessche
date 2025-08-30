const getCardBackground = () => 'var(--card)';
const getCardForeground = () => 'var(--card-foreground)';
const getPrimary = () => 'var(--primary)';
const getPrimaryForeground = () => 'var(--primary-foreground)';
const getSecondary = () => 'var(--secondary)';
const getSecondaryForeground = () => 'var(--secondary-foreground)';

const timelineStyles = {
  workExperience: {
    lineColor: 'var(--border)',
    cardStyle: () => ({
      boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
      padding: '20px',
    }),
    iconStyle: { background: getSecondary(), color: getPrimary() },
    position: 'right',
  },
  education: {
    lineColor: 'var(--border)',
    cardStyle: () => ({
      boxShadow: '0 5px 10px rgba(0,0,0,0.05)',
      padding: '20px',
    }),
    iconStyle: { background: getSecondary(), color: getPrimary() },
    position: 'left',
  },
  hobbies: {
    lineColor: 'var(--border)',
    cardStyle: () => ({
      boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
      padding: '20px',
    }),
    iconStyle: { background: getSecondary(), color: getPrimary() },
    position: 'right',
  },
};

export default timelineStyles;

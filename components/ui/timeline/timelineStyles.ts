export const getCardBackground = () => 'var(--card)';
export const getCardForeground = () => 'var(--card-foreground)';
export const getPrimary = () => 'var(--primary)';
export const getPrimaryForeground = () => 'var(--primary-foreground)';
export const getSecondary = () => 'var(--secondary)';
export const getSecondaryForeground = () => 'var(--secondary-foreground)';

const timelineStyles = {
    workExperience: {
        lineColor: 'var(--border)',
        cardStyle: () => ({
            boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
            padding: '20px',
            color: getPrimary(),
            background: getCardBackground(),
        }),
        iconStyle: { background: getSecondary(), color: getPrimary() },
        position: 'right',
    },
    education: {
        lineColor: 'var(--border)',
        cardStyle: () => ({
            boxShadow: '0 5px 10px rgba(0,0,0,0.05)',
            padding: '20px',
            color: getPrimary(),
            background: getCardBackground(),
        }),
        iconStyle: { background: getSecondary(), color: getPrimary() },
        position: 'left',
    },
    hobbies: {
        lineColor: 'var(--border)',
        cardStyle: () => ({
            boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
            padding: '20px',
            color: getPrimary(),
            background: getCardBackground(),
        }),
        iconStyle: { background: getSecondary(), color: getPrimary() },
        position: 'right',
    },
};

export default timelineStyles;

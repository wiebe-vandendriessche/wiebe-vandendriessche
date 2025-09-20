import React from 'react';
import Lanyard from '@/components/ui/Lanyard';

const ContactPage: React.FC = () => {
    return (
        <section>
            <Lanyard position={[0, 0, 20]} gravity={[0, -40, 0]} />
        </section>
    );
};

export default ContactPage;
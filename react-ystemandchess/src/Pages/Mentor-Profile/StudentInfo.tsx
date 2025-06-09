import React from 'react';

export default function StudentInfo({
    firstName,
    lastName,
}) {
    return (
        <div className="student-info">
            <h2>Your Student: {firstName} {lastName} </h2>
            <p>Here you can view and manage student information.</p>
            {/* Add more functionality as needed */}
        </div>
    );
}
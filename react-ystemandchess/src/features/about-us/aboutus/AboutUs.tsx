import React from 'react';
import aboutUsImage from "../../../assets/images/aboutUs/about-us.png"; // Replace with actual image path
import dividerIcon from "../../../assets/images/aboutUs/divide_icon.png"; // Replace with actual icon path
import statusIcon1 from "../../../assets/images/aboutUs/02.png"; // Replace with actual icon path
import statusIcon2 from "../../../assets/images/aboutUs/09.png"; // Replace with actual icon path
import statusIcon3 from "../../../assets/images/aboutUs/40.png"; // Replace with actual icon path
import studentsImage from "../../../assets/images/aboutUs/student.png"; // Replace with actual image path
import { cn } from "../../../core/utils/cn";

const sectionHeadingClassName = "font-bold text-dark";
const paragraphClassName = "text-base text-muted";
const sectionContainerClassName = "text-center";

const statusItems = [
    { icon: statusIcon1, alt: "Status Icon 1", value: "200+", label: "Courses Offered" },
    { icon: statusIcon2, alt: "Status Icon 2", value: "10,000+", label: "Students Enrolled" },
    { icon: statusIcon3, alt: "Status Icon 3", value: "98%", label: "Satisfaction Rate" },
];

const currentStatusItems = [
    "Over 50 new courses in development.",
    "Partnering with industry leaders to create specialized programs.",
    "Expanding to more regions worldwide.",
    "Launching mobile applications for easier access.",
];

const AboutUs = () => {
    return (
        <div className="px-5 py-5 font-sans text-gray">
            {/* Intro Section */}
            <div className={cn(sectionContainerClassName, "mb-10")}>
                <h1 className={cn(sectionHeadingClassName, "text-[28px]")}>About Us</h1>
                <p className={cn(paragraphClassName, "mx-auto max-w-[600px]")}>
                    Welcome to our platform! We are committed to delivering top-notch educational resources
                    and connecting learners with the best opportunities. Our mission is to foster growth,
                    creativity, and success in students from all backgrounds.
                </p>
                <img
                    src={aboutUsImage}
                    alt="About Us"
                    className="mx-auto mt-[15px] block w-full max-w-[500px] rounded-lg"
                />
            </div>

            {/* Offer Section */}
            <div className={cn(sectionContainerClassName, "my-10")}>
                <img src={dividerIcon} alt="Divider Icon" className="mx-auto mb-[10px] block w-10" />
                <h2 className={cn(sectionHeadingClassName, "text-2xl")}>What We Offer</h2>
                <p className={cn(paragraphClassName, "mt-[10px]")}>
                    We provide a variety of resources, including online courses, interactive workshops, and
                    personalized mentoring to help students excel in their educational and career journeys.
                </p>
            </div>

            {/* Status Section */}
            <div className="mb-10 flex flex-wrap justify-center gap-5">
                {statusItems.map((item) => (
                    <div key={item.label} className="text-center">
                        <img src={item.icon} alt={item.alt} className="mx-auto mb-[10px] block w-20" />
                        <h3 className="text-4xl font-bold text-gray">{item.value}</h3>
                        <p className={paragraphClassName}>{item.label}</p>
                    </div>
                ))}
            </div>

            {/* Current Status Section */}
            <div className="mb-10 rounded-lg bg-soft px-5 py-5 text-center">
                <h2 className={cn(sectionHeadingClassName, "mb-[15px] text-[22px] text-gray")}>Our Current Status</h2>
                <ul>
                    {currentStatusItems.map((item) => (
                        <li
                            key={item}
                            className="mb-[10px] flex items-center justify-center gap-[10px] text-base text-muted last:mb-0"
                        >
                            <img src={dividerIcon} alt="" aria-hidden="true" className="h-4 w-4 shrink-0" />
                            <span>{item}</span>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Description Section */}
            <div className="mt-5 rounded-lg bg-light px-[30px] py-[30px] text-center">
                <p className="mx-auto mb-5 max-w-[800px] text-sm leading-[1.5] text-muted">
                    Our team of dedicated educators, developers, and industry professionals works tirelessly
                    to bring students the most relevant and impactful educational content. We believe in
                    empowering students to reach their full potential by providing them with the tools and
                    knowledge they need to succeed in an ever-changing world.
                </p>
                <img
                    src={studentsImage}
                    alt="Students Engaged in Learning"
                    className="mx-auto mt-5 block w-full max-w-[400px] rounded-lg"
                />
            </div>
        </div>
    );
};

export default AboutUs;

import "./LessonsStyle.css";
import { useNavigate } from "react-router";

export default function LessonSelection() {
    const navigate = useNavigate();
    return(
        <div className="whole-page">
            <div className="block">
                <h1 className="header">Pawn</h1>
                <ul className="list">
                    <li onClick={() => navigate("/lessons", {state: {scenario: "Pawn", lesson: "Basic"}})}>Basic</li>
                    <li onClick={() => navigate("/lessons", {state: {scenario: "Pawn", lesson: "Capture"}})}>Capture</li>
                    <li onClick={() => navigate("/lessons", {state: {scenario: "Pawn", lesson: "Training 1"}})}>Training 1</li>
                    <li>Training 2</li>
                    <li>Training 3</li>
                    <li>Special Move</li>
                </ul>
            </div>
            <div className="block">
                <h1 className="header">Bishop</h1>
                <ul className="list">
                    <li>The Basic</li>
                    <li>Training 1</li>
                    <li>Training 2</li>
                    <li>Training 3</li>
                    <li>Training 4</li>
                    <li>Final</li>
                </ul>
            </div>
            <div className="block">
                <h1 className="header">Knight</h1>
                <ul className="list">
                    <li>The Basic</li>
                    <li>Training 1</li>
                    <li>Training 2</li>
                    <li>Training 3</li>
                    <li>Training 4</li>
                    <li>Final</li>
                </ul>
            </div>
            <div className="block">
                <h1 className="header">Rook</h1>
                <ul className="list">
                    <li>The Basic</li>
                    <li>Training 1</li>
                    <li>Training 2</li>
                    <li>Training 3</li>
                    <li>Training 4</li>
                    <li>Final</li>
                </ul>
            </div>
            <div className="block">
                <h1 className="header">Queen</h1>
                <ul className="list">
                    <li>The Basic</li>
                    <li>Training 1</li>
                    <li>Training 2</li>
                    <li>Training 3</li>
                    <li>Final</li>
                </ul>
            </div>
        </div>
    );
}
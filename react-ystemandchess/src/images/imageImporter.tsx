// imageImporter.ts

import LogoLineBr from "./LogoLineBreak.png";
import TreesGroup from "./Trees-Group.png";
import Heart from "./heart-regular.svg";
import Gem from "./gem-regular.svg";
import LargeInfo from "./large_info.png";
import ChessGroup from "./chessGroup.png";
import Book1 from "./book-howtostart.png";
import Book2 from "./book-thezerodollar.png";
import BuyNow from "./buy-now.png";

// Student Inventory Page
import userPortraitCamera from "./camera.svg";
import lineGraphPlaceholder from "./line-graph-placeholder.png";
import activityIcon from "./StudentInventoryIcons/activity-icon.svg";
import mentorIcon from "./StudentInventoryIcons/mentor-icon.svg";
import learningIcon from "./StudentInventoryIcons/learning-icon.svg";
import chessLessonsIcon from "./StudentInventoryIcons/chess-lessons-icon.svg";
import gamesIcon from "./StudentInventoryIcons/games-icon.svg";
import puzzlesIcon from "./StudentInventoryIcons/puzzles-icon.svg";
import playComputerIcon from "./StudentInventoryIcons/play-computer-icon.svg";
import recordingsIcon from "./StudentInventoryIcons/recordings-icon.svg";
import backpackIcon from "./StudentInventoryIcons/backpack-icon.svg";

// Chess Benefit Page
import mathComputerImg from "./mathArticle/computer.png";
import mathChampImg from "./mathArticle/Junechamp 2.png";

// Define the type for image keys dynamically
type ImageKey = 
  | "LogoLineBr" | "TreesGroup" | "Heart" | "Gem" | "LargeInfo" | "ChessGroup"
  | "Book1" | "Book2" | "BuyNow"
  | "mathComputerImg" | "mathChampImg"
  | "userPortraitCamera" | "lineGraphPlaceholder"
  | "activityIcon" | "mentorIcon" | "learningIcon" | "chessLessonsIcon"
  | "gamesIcon" | "puzzlesIcon" | "playComputerIcon" | "recordingsIcon" | "backpackIcon";

// Explicitly define the images object with keys and string values (image paths)
const images: { [key in ImageKey]: string } = {
  LogoLineBr,
  TreesGroup,
  Heart,
  Gem,
  LargeInfo,
  ChessGroup,
  Book1,
  Book2,
  BuyNow,
  mathComputerImg,
  mathChampImg,
  userPortraitCamera,
  lineGraphPlaceholder,
  activityIcon,
  mentorIcon,
  learningIcon,
  chessLessonsIcon,
  gamesIcon,
  puzzlesIcon,
  playComputerIcon,
  recordingsIcon,
  backpackIcon,
};

export default images;

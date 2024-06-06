import React from 'react';
import './Badges.scss';
import Images from '../../images/imageImporter'

const BadgeKnight = ({}) => {
    return (
        <div className="badge">
            <img src={Images.badgeKnight} alt="YSC Knight Badge" />
        </div>
    )
}
const BadgeKing = ({}) => {
    return (
        <div className="badge">
            <img src={Images.badgeKing} alt="YSC King Badge" />
        </div>
    )
}
const BadgeQueen = ({}) => {
    return (
        <div className="badge">
            <img src={Images.badgeQueen} alt="YSC Queen Badge" />
        </div>
    )
}
const BadgeRook = ({}) => {
    return (
        <div className="badge">
            <img src={Images.badgeRook} alt="YSC Rook Badge" />
        </div>
    )
}
const BadgePawn = ({}) => {
    return (
        <div className="badge">
            <img src={Images.badgePawn} alt="YSC Pawn Badge" />
        </div>
    )
}
const BadgeBishop = ({}) => {
    return (
        <div className="badge">
            <img src={Images.BadgeBishop} alt="YSC Bishop Badge" />
        </div>
    )
}

export default Badges = {
    BadgeKnight,
    BadgeKing,
    BadgeQueen,
    BadgeRook,
    BadgePawn,
    BadgeBishop
} 
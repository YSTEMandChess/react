/**
 * Controller handling set password
 * Validates the token and updates the user's password in the database
 */

import { updatePassword } from "./setPasswordService";

const setPassword = async (req: any, res: any) => {
  const { password, token } = req.body;

  if (!password || !token) {
    return res
      .status(400)
      .json({ message: 'Password and token are required.' });
  }

  try {
    const result = await updatePassword(password, token);

    if (result.success) {
      return res
        .status(200)
        .json({ message: 'Password successfully updated.' });
    } else {
      return res.status(400).json({ message: result.message });
    }
  } catch (error) {
    console.error('Error setting password:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

module.exports = {
  setPassword,
};

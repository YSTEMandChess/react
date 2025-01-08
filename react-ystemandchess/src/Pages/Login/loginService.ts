
let User: any;
export const verifyLogin = async (username: any, hashedPassword: any) => {
  try {
    const user = await User.findOne({
      username: username,
      password: hashedPassword,
    });

    return {
      success: !!user,
      user,
    };
  } catch (error) {
    console.error('Error verifying login:', error);
    throw error;
  }
};

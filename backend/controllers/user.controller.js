import User from "../models/user.model.js";

export const getUserProfileAndRepos = async (req, res) => {
  const { username } = req.params;

  try {
    // Check if the username is the default one
    if (username === "burakorkmez") {
      const userRes = await fetch(`https://api.github.com/users/${username}`, {
        headers: {
          authorization: `token ${process.env.GITHUB_API_KEY}`,
        },
      });

      if (!userRes.ok) {
        return res.status(userRes.status).json({ error: "Failed to fetch user profile from GitHub." });
      }

      const userProfile = await userRes.json();

      const repoRes = await fetch(userProfile.repos_url, {
        headers: {
          authorization: `token ${process.env.GITHUB_API_KEY}`,
        },
      });

      if (!repoRes.ok) {
        return res.status(repoRes.status).json({ error: "Failed to fetch repositories from GitHub." });
      }

      const repos = await repoRes.json();

      return res.status(200).json({ userProfile, repos });
    }

    // Check if the user exists in the database for non-default usernames
    const existingUser = await User.findOne({ username });
    if (!existingUser) {
      return res.status(404).json({ error: "This user is not registered in our app." });
    }

    // Fetch data from GitHub for the registered user
    const userRes = await fetch(`https://api.github.com/users/${username}`, {
      headers: {
        authorization: `token ${process.env.GITHUB_API_KEY}`,
      },
    });

    if (!userRes.ok) {
      return res.status(userRes.status).json({ error: "Failed to fetch user profile from GitHub." });
    }

    const userProfile = await userRes.json();

    const repoRes = await fetch(userProfile.repos_url, {
      headers: {
        authorization: `token ${process.env.GITHUB_API_KEY}`,
      },
    });

    if (!repoRes.ok) {
      return res.status(repoRes.status).json({ error: "Failed to fetch repositories from GitHub." });
    }

    const repos = await repoRes.json();

    res.status(200).json({ userProfile, repos });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const likeProfile = async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findById(req.user._id.toString());
    console.log(user, "auth user");
    const userToLike = await User.findOne({ username });

    if (!userToLike) {
      return res.status(404).json({ error: "User is not a member" });
    }

    if (user.likedProfiles.includes(userToLike.username)) {
      return res.status(400).json({ error: "User already liked" });
    }

    userToLike.likedBy.push({ username: user.username, avatarUrl: user.avatarUrl, likedDate: Date.now() });
    user.likedProfiles.push(userToLike.username);

    // await userToLike.save();
    // await user.save();
    await Promise.all([userToLike.save(), user.save()]);

    res.status(200).json({ message: "User liked" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getLikes = async (req, res) => {
  try {
    const user = await User.findById(req.user._id.toString());
    res.status(200).json({ likedBy: user.likedBy });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

function updateLoading(scene)
{
    window.shuffle_match = new ShuffleMatch();
    // Remove loading screen because we no longer need it
    window.app.removeScene(scene);
}
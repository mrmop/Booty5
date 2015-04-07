function updateLoading(scene)
{
    window.shuffle_match = new ShuffleMatch();
    // Remove loading screen because we no longer need it
    b5.app.removeScene(scene);
}
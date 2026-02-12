#Branches strategy

## main branch (stable):
**Do not work on main branch!**<br>
Programm stable (No crash, no memory leaks,...)<br>
Pull requests only from approved dev branch<br>
Pull request type: Merge commit (keep history of merge commit)<br>
[See template_main_pull_request.md](template_main_pull_request.md)

## dev branch(unstable):<br>
*Try to not work on dev branch!*<br>
Collaborative branch<br>
Main branch for development<br>
Default branch on github<br>
Pull requests from all other branches<br>
Pull request type: Squash and merge commit (erase history of your own commits)<br>
[See template_dev_pull_request.md](template_dev_pull_request.md)

## all branches <br>
A branch per task/ issue/ debug (not per personn)<br>
Handle your own commits<br>
Pull request on dev when you are done<br>
[See template_branch_commit.md](template_branch_commit.md)<br>
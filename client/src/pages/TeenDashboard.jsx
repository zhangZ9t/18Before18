import DashboardLayout from '../components/DashboardLayout'
import LifeModeTeenPanel from '../lifeMode/LifeModeTeenPanel'

const navItems = [{ id: 'life', label: 'Life Mode' }]

function TeenDashboard() {
  return (
    <DashboardLayout role="teen" navItems={navItems} activeTab="life" onTabChange={() => {}} showCoach={false}>
      <LifeModeTeenPanel parentName="Alex" teenName="Jamie" />
      <p className="dashboard-footnote">
        Hackathon demo — same shared week as Parent. Switch roles in the header to complete the loop.
      </p>
    </DashboardLayout>
  )
}

export default TeenDashboard
